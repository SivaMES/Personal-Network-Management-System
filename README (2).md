# Personal Network Management System

A mobile + laptop friendly **personal CRM** that runs entirely inside your own Google account (Google Sheets + Apps Script). No server, no monthly cost.

Track family, friends, clients and mentors, see a **month / year calendar** of what is **pending** and **completed**, tap **Call** or **Message**, and log the result (Contacted / Discussed / Liked) with the exact date and time. Also keeps a simple register of family properties.

## Features
- Month and Year calendar; dots coloured by relationship (Relative, Client, Friend, Mentor); hollow dot = completed, filled dot = pending
- Pending and Completed lists for any day, month or year, plus full history per contact (tap a name)
- One-tap Call / Message; after the call the update form opens with the call duration filled in
- Status updates automatically (Due, Due Soon, Active, Dormant); Start/Stop button controls the daily automatic refresh
- **+** button opens a small popup: New contact, Log call / meeting, or New property
- Double-tap safe: a request can never be saved twice
- **Import phone contacts**: export your phone contacts as .vcf (or Google Contacts CSV), choose the file in the app, tick only the people you want, and import
- **Message** button: WhatsApp (wa.me) or SMS with ready templates; the contact is logged automatically
- **Health tab**: date-wise Medical, Food, Gym and Health plan with tick-off and "repeat for N days"
- **Master tab**: personal & family info, finance overview (income, expenses, loans, investments, insurance, retirement, tax, goals), assets & properties, emergency instructions; shows annual surplus, net worth and items due in 30 days
- Your data stays in your own Google Sheet

## Set up (about 5 minutes, no coding)
1. Create a new Google Sheet (sheets.new).
2. Open **Extensions → Apps Script**.
3. Replace the contents of `Code.gs` with `Code.gs` from this repo.
4. Click **+ → HTML**, name it exactly `Index`, and paste `Index.html` from this repo.
5. (Optional) Project Settings → tick *Show "appsscript.json" manifest file*, then paste `appsscript.json` and change `timeZone` to yours.
6. Click **Save**, choose the function `setup`, click **Run**, and accept the permissions.
   If Google shows "unverified app": **Advanced → Go to project (unsafe)**. It is your own script.
7. **Deploy → New deployment → Web app** → *Execute as: Me*, *Who has access: Only myself* → **Deploy**.
8. Open the web app link on your phone → browser menu → **Add to Home screen**.

In the sheet, the menu **Network System** has *Setup*, *Show app link*, *Start/Stop auto status* and *Refresh status now*.

## Updating to a new version
Replace `Code.gs` and `Index.html`, then **Deploy → Manage deployments → pencil → Version: New version → Deploy**. Without this step the phone keeps the old version.

## Sheets
| Sheet | Purpose |
|---|---|
| Contacts | Master list: name, category, relationship, company, phone, last/next contact, status, priority, stage, last outcome and time |
| Properties | House/land register: status, last verified, next review, documents, photos, tax |
| Activity | Every call/meeting logged, with date, time, duration, outcome |
| Health | Date-wise medical, food, gym and health plan items |
| Master | Personal, finance, asset and emergency records (one row per entry) |

Follow-up gap by priority (High 7 days, Medium 15, Low 30) can be changed in the `GAP` line of `Code.gs`.

## Troubleshooting
- **Call button does nothing**: the contact needs a phone number. Open the link in Chrome/Safari rather than inside the Drive or Sheets app.
- **Old screen after an update**: create a *New version* in Manage deployments.
- **"Setup sheets first" error**: run `setup` once from the editor.
- **Master tracker**: store only the last 4 digits of IDs/accounts and never passwords; note where originals are kept.
- **Privacy**: keep access set to *Only myself*. Each person should make their own copy; never share your data sheet.

## Add this project to GitHub
Web: open the repo → **Add file → Upload files** → drop `Code.gs`, `Index.html`, `appsscript.json`, `README.md` → **Commit changes**.

Command line:
```bash
git clone https://github.com/SivaMES/Personal-Network-Management-System.git
cd Personal-Network-Management-System
# copy the four files here (replace README.md)
git add .
git commit -m "Add Personal Network Management System"
git push
```
