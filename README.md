# 🚀 GetMyEmail

> **Stop paying $30–$50/month for GMass, Mailmeteor, or YAMM.**  
> GetMyEmail is a powerful, privacy-first, 100% free cold email engine that runs entirely inside your Google account.

---

## ⚡ Why GetMyEmail?

Most cold outreach tools charge hefty monthly fees just to send emails through your own Gmail account. They store your recipient data on third-party servers and lock essential features like A/B testing or automated follow-ups behind expensive pricing tiers.

**GetMyEmail gives you enterprise-grade outreach features for $0/month.**

- **Zero Subscriptions:** Runs on native Google Apps Script inside your Google Workspace or `@gmail.com` account.
- **100% Data Privacy:** Your contacts, pitch notes, and emails never leave your Google Drive.
- **Smart Bot & Scanner Defense:** Corporate email filters often pre-click links and trigger fake opens or accidental unsubscribes. GetMyEmail ignores opens within 120 seconds of sending and requires click confirmation for opt-outs.
- **Safe Mail Merge:** Cross-references recipient email addresses to ensure sorting or filtering rows in Google Sheets never misaligns tracking data.

---

## 🔥 Key Features

- 🧪 **Full A/B Split Testing:** Randomly test both subject lines and body copy (`A1_A` vs `A1_B`) to optimize response rates.
- 📬 **Threaded Follow-Ups:** Automatically sends follow-up replies on Day 7 and Day 14 inside the same Gmail thread until a reply or bounce is detected.
- 👁️ **Pixel Open Tracking:** Track email opens via a lightweight, self-hosted Web App endpoint.
- 🛑 **Automated Unsubscribe Engine:** Includes a clean opt-out link in footers that automatically halts sequence emails when clicked.
- 📝 **Draft Preview Mode:** Generate personalized previews in your Gmail Drafts folder to inspect formatting before pushing send.
- 📊 **Campaign Analytics Dashboard:** One-click generation of a summary tab showing open rates, reply rates, bounce metrics, and variant performance side-by-side.
- 🛡️ **Pacing & Safety Controls:** Enforce customizable daily sending caps, business-hour sending windows, and randomized delays between dispatches to protect domain reputation.

---

## 📊 Feature Comparison

| Feature | Outreach Mailer | GMass / Mailmeteor / YAMM |
| :--- | :--- | :--- |
| **Monthly Cost** | **$0 / Free & Open Source** | $15 – $50+ / month |
| **Data Privacy** | 100% Private (Your Google Account) | Third-party cloud servers |
| **A/B Split Testing** | Subject + Body Copy | Paid Tiers Only |
| **Automated Follow-ups** | Threaded Replies (Day 7 & 14) | Paid Tiers Only |
| **Bot/Scanner Defense** | Filters self-opens & Security Bots | Variable |
| **Unsubscribe Handler** | Auto-flags sheet + Confirmation Page | Paid Tiers Only |

---

## 🛠️ Quick Start (5-Minute Setup)

### Step 1: Set Up Your Google Sheet

Create a Google Sheet with two tabs:

#### 1. `Targets (Roles)`
Set up your spreadsheet columns matching these positions:
- **Col C (3):** `Company`
- **Col L (12):** `Email`
- **Col N (14):** `First Name`
- **Col O (15):** `Hook`
- **Col P (16):** `Role Angle`
- **Col Q (17):** `Email 1 Sent`
- **Col R (18):** `Follow-up 1 Due`
- **Col S (19):** `Follow-up 2 Due`
- **Col T (20):** `Status`
- **Col U (21):** `Notes`
- **Col V (22):** `Source`
- **Col W (23):** `Variant`
- **Col X (24):** `Thread ID`
- **Col Y (25):** `Opened At`

#### 2. `Email Templates`
Set up your template headers in Row 1 (`ID`, `Use`, `Send when`, `Subject`, `Body`).
Add your templates:
- `A1_A`: First Email (Variant A)
- `A1_B`: First Email (Variant B)
- `A2`: Follow-up 1
- `A3`: Follow-up 2

*Placeholders supported in body/subject:* `{{First Name}}`, `{{Company}}`, `{{Hook}}`, `{{Role_Angle}}`.

## 📋 Starter Template & Spreadsheet Downloads

To get started immediately without setting up spreadsheet columns by hand, create a copy of the pre-formatted Google Sheet or download the starter template workbook.

### Option 1: One-Click Google Sheets Copy
Click the link below to generate a clean, unpopulated copy directly in your Google Drive with all tabs, column positions, and headers pre-configured:

👉 **[Make a Copy of Outreach Mailer Spreadsheet Template](https://docs.google.com/spreadsheets/d/1oc8hT4tIQoG5zXIXwA5jcZQgxrJV9j7E2kHeGZe7TMQ/copy)**

### Option 2: Download Excel Workbook Template
Download `Outreach_Mailer_Template.xlsx` from this repository and upload it directly to Google Drive or import it into Google Sheets. It contains both pre-configured tabs (`Targets (Roles)` and `Email Templates`) ready to use.

---

### Step 2: Install Code & Deploy Web App

1. In Google Sheets, click **Extensions > Apps Script**.
2. Replace all code in `Code.gs` with the script from this repository and save.
3. Click **Deploy > New deployment**.
4. Select **Web app** as the deployment type.
5. Set **Execute as:** `Me` and **Who has access:** `Anyone`.
6. Click **Deploy**, copy the generated **Web App URL**, and paste it into `CFG.WEB_APP_URL` at the top of `Code.gs`. Save the file.

---

### Step 3: Run Campaign

Refresh your Google Sheet to see the new **Outreach** menu in the top bar:

1. **Send test sequence to myself:** Verify draft creation and follow-up threading without tracking pixels.
2. **Create draft previews in Gmail:** Inspect personalized drafts in your Gmail inbox before sending.
3. **Send first emails:** Dispatch initial emails with randomized A/B split testing.
4. **Send due follow-ups now:** Manually trigger pending follow-ups.
5. **Check replies and bounces:** Scan threads for incoming replies or bounces.
6. **Generate Campaign Analytics report:** Produce an updated performance summary tab.
7. **Turn on daily follow-ups:** Enable the automated weekday 9:00 AM trigger for hands-free follow-up processing.

---

## 🔒 Privacy & Sending Limits

Outreach Mailer respects standard Google sending caps (100 emails/day for standard `@gmail.com` accounts, 1,500 emails/day for Google Workspace). We recommend capping daily outreach between 10 and 50 emails per account for optimal inbox deliverability.

---

## ⚖️ Compliance and Responsible Use

Outreach Mailer is a tool. You are responsible for how you use it. This is general information, not legal advice.

- **Know your local rules.** Cold and commercial email is regulated differently by country and by recipient type. In the EU and UK, GDPR and ePrivacy rules apply, and some countries are stricter than others about unsolicited B2B email. Check the rules for where you and your recipients are based.
- **Have a legitimate reason to write.** Email people for a clear, relevant purpose. Do not scrape or buy lists, and do not email people with no connection to your message.
- **Be transparent.** Use your real name and a real reply address. Say who you are and why you are writing. Where the law requires it, add your postal address.
- **Honor opt-outs.** Keep the unsubscribe link on, and stop emailing anyone who unsubscribes or replies "no". If someone asks how you got their data, tell them.
- **Open tracking needs care.** Tracking pixels can count as processing personal data and may need consent or disclosure in some regions. Open data is also unreliable, because mail apps and security scanners can trigger fake opens. You can turn it off with `ENABLE_OPEN_TRACKING: false`.
- **Keep data minimal.** Store only what you need, delete contacts you no longer need, and do not commit real contact lists to GitHub.
- **Respect sending limits.** Google caps daily sends per account and may suspend accounts that send spam. Keep volumes low and messages personal.

The authors and contributors are not responsible for misuse.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Contributions, bug reports, and feature requests are welcome!
