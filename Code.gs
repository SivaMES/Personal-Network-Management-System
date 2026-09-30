/** PERSONAL NETWORK MANAGEMENT SYSTEM - Google Sheets + Apps Script **/
var SHEETS = {
  Contacts: ['ID','Name','Category','Relationship','Company','Role','Phone','Email','City','Last Contact','Next Contact','Status','Priority','Stage','Birthday','Preferred Method','Notes','Last Outcome','Last Contact Time'],
  Properties: ['ID','Property','Owner/Relation','Location','Type','Current Status','Last Verified','Next Review','Document Status','Photo Status','Approx Value','Tax Status','Notes'],
  Activity: ['Date','Contact','Category','Activity','Duration','Outcome','Next Action','Time']
};
var DATE_COLS = ['Last Contact','Next Contact','Birthday','Last Verified','Next Review','Date'];
var TIME_COLS = ['Time','Last Contact Time'];
var GAP = {High: 7, Medium: 15, Low: 30}; // days until next follow-up

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Network System')
    .addItem('1. Setup sheets (first time)', 'setup')
    .addItem('2. Show app link', 'showLink')
    .addItem('Start auto status', 'startAuto')
    .addItem('Stop auto status', 'stopAuto')
    .addItem('Refresh status now', 'refreshStatus')
    .addToUi();
}

function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]])
      .setBackground('#1f4e9c').setFontColor('#fff').setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  var c = ss.getSheetByName('Contacts');
  if (c.getLastRow() === 1) {
    var t = new Date(), d = function (n) { return new Date(t.getFullYear(), t.getMonth(), t.getDate() + n); };
    writeRow(c, 'Contacts', 2, ['F001','Person A','Family','Relative','','','','','Chennai',d(-10),d(5),'Active','High','Close','','Call','Family follow-up','','']);
    writeRow(c, 'Contacts', 3, ['P001','Person B','Professional','Client','ABC Ltd','Plant Head','','','Chennai',d(-5),d(10),'Active','High','Active opportunity','','LinkedIn','MES discussion','','']);
    writeRow(c, 'Contacts', 4, ['FR001','Person C','Friend','Friend','','','','','Chennai',d(-20),d(1),'Active','Medium','Growing','','Meeting','Meet/call','','']);
  }
  var p = ss.getSheetByName('Properties');
  if (p.getLastRow() === 1) {
    writeRow(p, 'Properties', 2, ['H001','Family House','Father','Chennai','House','Occupied',new Date(),new Date(Date.now() + 90 * 864e5),'Verified','Updated','','','Maintenance OK']);
  }
  refreshStatus();
  SpreadsheetApp.getUi().alert('Setup done. Now: Deploy > New deployment > Web app, then open the link on your phone.');
}

function showLink() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(url ? 'Open on mobile:\n' + url : 'Deploy first: Deploy > New deployment > Web app');
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Personal Network System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- helpers ---------- */
function fmt(v, col) {
  var tz = Session.getScriptTimeZone();
  if (v instanceof Date) return Utilities.formatDate(v, tz, TIME_COLS.indexOf(col) > -1 ? 'hh:mm:ss a' : 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : String(v);
}
function toDate(s) {
  if (!s) return '';
  var a = String(s).split('-');
  return new Date(+a[0], +a[1] - 1, +a[2]);
}
/** Write values starting at column `from` (1-based). Text format keeps phones/times intact. */
function writeCells(sh, name, r, from, values) {
  var h = SHEETS[name].slice(from - 1, from - 1 + values.length);
  var rng = sh.getRange(r, from, 1, values.length);
  rng.setNumberFormats([h.map(function (c) { return DATE_COLS.indexOf(c) > -1 ? 'dd-mmm-yy' : '@'; })]);
  rng.setValues([values]);
}
function writeRow(sh, name, r, row) { writeCells(sh, name, r, 1, row); }

function readSheet(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var h = SHEETS[name];
  return sh.getRange(2, 1, sh.getLastRow() - 1, h.length).getValues().map(function (r, i) {
    var o = {_row: i + 2};
    h.forEach(function (c, j) { o[c] = fmt(r[j], c); });
    return o;
  }).filter(function (o) { return o[h[1]]; });
}
function statusFor(next, last, old) {
  if (!(next instanceof Date)) return old || '';
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var days = Math.round((next - t) / 864e5);
  if (days < 0) return 'Due';
  if (days <= 3) return 'Due Soon';
  if (last instanceof Date && (t - last) / 864e5 > 90) return 'Dormant';
  return 'Active';
}
/** Run once per request id, one at a time: a double tap can never save twice. */
function once(id, fn) {
  var cache = CacheService.getScriptCache(), lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hit = id ? cache.get(id) : null;
    if (hit) return JSON.parse(hit);
    var res = fn();
    if (id) cache.put(id, JSON.stringify(res), 600);
    return res;
  } finally { lock.releaseLock(); }
}
function ensureHeaders() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh) sh.getRange(1, 1, 1, SHEETS[n].length).setValues([SHEETS[n]]);
  });
}

/* ---------- API for the UI ---------- */
function getData() {
  ensureHeaders();
  refreshStatus();
  return {
    contacts: readSheet('Contacts'),
    properties: readSheet('Properties'),
    activity: readSheet('Activity').reverse().slice(0, 3000),
    auto: isAuto(),
    today: fmt(new Date())
  };
}

function saveRow(name, obj) {
  return once(obj.reqId, function () {
    var sh = SpreadsheetApp.getActive().getSheetByName(name), h = SHEETS[name];
    if (!obj.ID) {
      var pre = name === 'Contacts' ? (obj.Category || 'C').charAt(0).toUpperCase() : 'H';
      obj.ID = pre + String(Date.now()).slice(-6);
    }
    var r = obj._row ? +obj._row : sh.getLastRow() + 1;
    var old = obj._row ? sh.getRange(r, 1, 1, h.length).getValues()[0] : [];
    var row = h.map(function (c, i) {
      if (obj[c] === undefined) {
        var o = old[i];
        return o === undefined ? '' : (o instanceof Date && TIME_COLS.indexOf(c) > -1 ? fmt(o, c) : o);
      }
      return DATE_COLS.indexOf(c) > -1 ? toDate(obj[c]) : obj[c];
    });
    var res = {row: r, ID: obj.ID};
    if (name === 'Contacts') {
      row[11] = statusFor(row[10], row[9], row[11]);
      res.Status = row[11];
    }
    writeRow(sh, name, r, row);
    return res;
  });
}

function deleteRow(name, row, reqId) {
  return once(reqId, function () {
    SpreadsheetApp.getActive().getSheetByName(name).deleteRow(+row);
    return {ok: true};
  });
}

/** Log a call/meeting with exact date + time and schedule the next follow-up. */
function logActivity(obj) {
  return once(obj.reqId, function () {
    var ss = SpreadsheetApp.getActive(), tz = Session.getScriptTimeZone(), now = new Date();
    var time = Utilities.formatDate(now, tz, 'hh:mm:ss a');
    var act = ss.getSheetByName('Activity');
    writeRow(act, 'Activity', act.getLastRow() + 1,
      [now, obj.Contact, obj.Category || '', obj.Activity || '', obj.Duration || '', obj.Outcome || '', obj['Next Action'] || '', time]);
    var sh = ss.getSheetByName('Contacts'), names = sh.getRange(1, 2, sh.getLastRow(), 1).getValues();
    var r = 0;
    if (obj.Row && names[obj.Row - 1] && names[obj.Row - 1][0] === obj.Contact) r = +obj.Row;
    else for (var i = 1; i < names.length; i++) if (names[i][0] === obj.Contact) { r = i + 1; break; }
    var res = {date: fmt(now), time: time};
    if (r) {
      var v = sh.getRange(r, 10, 1, 10).getValues()[0]; // cols 10..19
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var next = obj.Next ? toDate(obj.Next) : new Date(today.getFullYear(), today.getMonth(), today.getDate() + (GAP[v[3]] || 15));
      v[0] = today; v[1] = next; v[2] = statusFor(next, today, v[2]); v[8] = obj.Outcome || ''; v[9] = time;
      writeCells(sh, 'Contacts', r, 10, v);
      res.next = fmt(next); res.status = v[2];
    }
    return res;
  });
}

/* ---------- automatic status ---------- */
function refreshStatus() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Contacts');
  if (!sh || sh.getLastRow() < 2) return;
  var n = sh.getLastRow() - 1;
  var data = sh.getRange(2, 10, n, 3).getValues(); // Last, Next, Status
  var out = data.map(function (r) { return [statusFor(r[1], r[0], r[2])]; });
  sh.getRange(2, 12, n, 1).setValues(out);
}

/* ---------- start / stop ---------- */
function isAuto() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'refreshStatus'; });
}
function startAuto() {
  if (!isAuto()) ScriptApp.newTrigger('refreshStatus').timeBased().everyDays(1).atHour(6).create();
  return isAuto();
}
function stopAuto() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshStatus') ScriptApp.deleteTrigger(t);
  });
  return isAuto();
}
