/**
 * Outreach Mailer (v5.1 - Open Source Release)
 * A free, privacy-focused cold email engine for Gmail & Google Sheets.
 *
 * Features:
 *  - Full A/B Split Testing (Subject + Body)
 *  - Open Tracking with bot scanner protection & self-open filtering
 *  - Automated Unsubscribe link handling with confirmation safeguard
 *  - Draft Preview Mode in Gmail
 *  - Campaign Analytics Report generation
 *  - Strict sending window limits & random delay pacing
 *
 * License: MIT
 */

const CFG = {
  SHEET: 'Targets (Roles)',
  TEMPLATES: 'Email Templates',
  ANALYTICS_SHEET: 'Campaign Analytics',
  SENDER_NAME: 'Your Name', // Replace with your default display name
  DAILY_LIMIT: 10,       // Max sends per day
  MIN_PAUSE_SEC: 8,      // Minimum delay between emails
  MAX_PAUSE_SEC: 25,     // Maximum delay between emails

  // Sending Time Restrictions (24h format, in your Apps Script project time zone)
  SEND_WINDOW_START: 9,
  SEND_WINDOW_END: 17,

  // Follow-Up Intervals (Days)
  FU1_DAYS: 7,
  FU2_DAYS: 14,

  // Read Receipt & Unsubscribe Settings
  ENABLE_OPEN_TRACKING: true,
  ENABLE_UNSUBSCRIBE: true,
  IGNORE_OPENS_WITHIN_SEC: 120,
  WEB_APP_URL: '', // Paste your deployed Apps Script Web App URL here

  // Column numbers on Targets sheet (1-based index)
  COL: {
    COMPANY: 3, EMAIL: 12, FIRST: 14, HOOK: 15, ANGLE: 16,
    SENT1: 17, FU1: 18, FU2: 19, STATUS: 20, NOTES: 21, SOURCE: 22,
    VARIANT: 23, THREAD: 24, OPENED: 25
  }
};

/* ---------- Web App Endpoint for Read Receipts & Unsubscribe ---------- */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const row = parseInt(p.row, 10);
    const action = p.action;
    const email = String(p.e || '').trim().toLowerCase();
    if (row && row > 1 && email) {
      const sh = sheet_();
      const rowEmail = String(sh.getRange(row, CFG.COL.EMAIL).getValue() || '').trim().toLowerCase();
      if (rowEmail && rowEmail === email) {
        if (action === 'unsub') {
          if (p.confirm !== '1') {
            const link = CFG.WEB_APP_URL + '?row=' + row + '&action=unsub&confirm=1&e=' + encodeURIComponent(email);
            return HtmlService.createHtmlOutput(
              '<div style="font-family:Arial,sans-serif;max-width:420px;margin:60px auto;text-align:center;">' +
              '<h2>Unsubscribe Request</h2>' +
              '<p>Do you want to stop receiving emails from ' + CFG.SENDER_NAME + '?</p>' +
              '<p><a href="' + link + '" style="background:#1F3A5F;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px;display:inline-block;font-weight:bold;">Yes, unsubscribe me</a></p></div>'
            );
          }
          sh.getRange(row, CFG.COL.STATUS).setValue('Unsubscribed');
          sh.getRange(row, CFG.COL.NOTES).setValue('Opted out via unsubscribe link on ' + new Date().toLocaleDateString());
          return ContentService.createTextOutput('You have been unsubscribed. No further emails will be sent.').setMimeType(ContentService.MimeType.TEXT);
        } else if (action === 'open') {
          const current = sh.getRange(row, CFG.COL.OPENED).getValue();
          const sent = safeDate_(sh.getRange(row, CFG.COL.SENT1).getValue());
          const tooSoon = sent && (Date.now() - sent.getTime()) < CFG.IGNORE_OPENS_WITHIN_SEC * 1000;
          if (!current && sent && !tooSoon) {
            sh.getRange(row, CFG.COL.OPENED).setValue(new Date());
          }
        }
      }
    }
  } catch (err) {
    // Silent catch
  }
  return ContentService.createTextOutput().setMimeType(ContentService.MimeType.TEXT);
}

/* ---------- Menu ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Outreach')
    .addItem('1. Send test sequence to myself', 'testSequence')
    .addSeparator()
    .addItem('2. Create draft previews in Gmail (Review first)', 'createDraftsOnly')
    .addItem('3. Send first emails (A/B Subject + Body)', 'sendFirstEmails')
    .addItem('4. Send due follow-ups now', 'sendDueFollowUps')
    .addItem('5. Check replies and bounces', 'checkReplies')
    .addSeparator()
    .addItem('6. Generate Campaign Analytics report', 'generateCampaignStats')
    .addSeparator()
    .addItem('Turn on daily follow-ups (weekdays, 9am)', 'installDailyTrigger')
    .addItem('Turn off daily follow-ups', 'removeDailyTrigger')
    .addToUi();
}

/* ---------- Helpers ---------- */

function sheet_() {
  const s = SpreadsheetApp.getActive().getSheetByName(CFG.SHEET);
  if (!s) throw new Error('Sheet not found: ' + CFG.SHEET);
  return s;
}

function templates_() {
  const s = SpreadsheetApp.getActive().getSheetByName(CFG.TEMPLATES);
  if (!s) throw new Error('Sheet not found: ' + CFG.TEMPLATES);
  const out = {};
  s.getDataRange().getValues().slice(1).forEach(function (r) {
    if (r[0]) out[String(r[0]).trim()] = { subject: String(r[3]), body: String(r[4]) };
  });
  return out;
}

function fill_(text, vars) {
  if (!text) return '';
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (m, k) {
    return vars[k] !== undefined ? String(vars[k]) : m;
  });
}

function vars_(row) {
  const C = CFG.COL;
  return {
    'First Name': String(row[C.FIRST - 1] || '').trim(),
    'Company': String(row[C.COMPANY - 1] || '').trim(),
    'Hook': String(row[C.HOOK - 1] || '').trim(),
    'Role_Angle': String(row[C.ANGLE - 1] || '').trim()
  };
}

function ready_(row) {
  const C = CFG.COL;
  const status = String(row[C.STATUS - 1] || '').trim();
  if (status === 'Unsubscribed' || status === 'Closed') return false;
  const v = vars_(row);
  const email = String(row[C.EMAIL - 1] || '').trim();
  return email.indexOf('@') > 0 && v['First Name'] && v['Company'] && v['Hook'] && v['Role_Angle'];
}

function me_() {
  return (Session.getEffectiveUser().getEmail() || '').toLowerCase();
}

function dayKey_() {
  return 'sent_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function sentToday_() {
  return Number(PropertiesService.getScriptProperties().getProperty(dayKey_()) || 0);
}

function addSent_(n) {
  PropertiesService.getScriptProperties().setProperty(dayKey_(), String(sentToday_() + n));
}

function pause_() {
  const s = CFG.MIN_PAUSE_SEC + Math.random() * (CFG.MAX_PAUSE_SEC - CFG.MIN_PAUSE_SEC);
  Utilities.sleep(Math.round(s * 1000));
}

function isWithinSendingWindow_() {
  const hour = new Date().getHours();
  return hour >= CFG.SEND_WINDOW_START && hour < CFG.SEND_WINDOW_END;
}

function addDays_(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function safeDate_(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function ensureHeaders_(sh) {
  const C = CFG.COL;
  if (!sh.getRange(1, C.VARIANT).getValue()) sh.getRange(1, C.VARIANT).setValue('Variant').setFontWeight('bold');
  if (!sh.getRange(1, C.THREAD).getValue()) sh.getRange(1, C.THREAD).setValue('Thread ID').setFontWeight('bold');
  if (!sh.getRange(1, C.OPENED).getValue()) sh.getRange(1, C.OPENED).setValue('Opened At').setFontWeight('bold');
}

function buildHtmlBody_(bodyText, rowNum, email) {
  let html = bodyText.replace(/\n/g, '<br>');
  if (!rowNum || !email || !CFG.WEB_APP_URL) return html;
  const base = CFG.WEB_APP_URL + (CFG.WEB_APP_URL.indexOf('?') > -1 ? '&' : '?') +
               'row=' + rowNum + '&e=' + encodeURIComponent(String(email).trim().toLowerCase());
  if (CFG.ENABLE_OPEN_TRACKING) {
    html += '<img src="' + base + '&action=open&t=' + Date.now() + '" width="1" height="1" style="display:none !important;" alt="" />';
  }
  if (CFG.ENABLE_UNSUBSCRIBE) {
    html += '<br><br><p style="font-size:11px;color:#888;">If you prefer not to receive further emails, <a href="' + base + '&action=unsub">click here to unsubscribe</a>.</p>';
  }
  return html;
}

function deleteDraftsTo_(drafts, email) {
  const target = String(email).trim().toLowerCase();
  drafts.forEach(function (d) {
    try {
      if (d.getMessage().getTo().toLowerCase().indexOf(target) > -1) d.deleteDraft();
    } catch (err) { /* already deleted */ }
  });
}

function threadState_(id, me) {
  const th = GmailApp.getThreadById(id);
  const state = { replied: false, bounced: false };
  if (!th) return state;
  th.getMessages().forEach(function (m) {
    const from = m.getFrom().toLowerCase();
    if (me && from.indexOf(me) > -1) return;
    if (/mailer-daemon|postmaster/.test(from)) state.bounced = true;
    else state.replied = true;
  });
  return state;
}

function setRow_(sh, r, status, note) {
  sh.getRange(r, CFG.COL.STATUS).setValue(status);
  if (note) sh.getRange(r, CFG.COL.NOTES).setValue(note);
}

/* ---------- Draft Preview Mode ---------- */

function createDraftsOnly() {
  const ui = SpreadsheetApp.getUi();
  const sh = sheet_();
  ensureHeaders_(sh);
  const allTemplates = templates_();
  const C = CFG.COL;
  const data = sh.getDataRange().getValues();

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = String(row[C.STATUS - 1] || '').trim();
    if ((status === '' || status === 'Not started') && !row[C.SENT1 - 1] && ready_(row)) {
      rows.push(i);
    }
  }

  if (!rows.length) {
    ui.alert('No eligible rows found to generate drafts.');
    return;
  }

  let created = 0;
  rows.forEach(function (i) {
    const row = data[i], r = i + 1, v = vars_(row);
    const to = String(row[C.EMAIL - 1]).trim();

    const useVariantB = Math.random() < 0.5;
    const variantKey = useVariantB ? 'A1_B' : 'A1_A';
    const tpl = allTemplates[variantKey] || allTemplates.A1;
    const variantLabel = allTemplates[variantKey] ? (useVariantB ? 'B' : 'A') : 'Default';

    if (tpl) {
      const subjectText = fill_(tpl.subject, v);
      const bodyText = fill_(tpl.body, v);
      const htmlContent = buildHtmlBody_(bodyText, r, to);

      GmailApp.createDraft(to, subjectText, bodyText, {
        name: CFG.SENDER_NAME,
        htmlBody: htmlContent
      });

      sh.getRange(r, C.VARIANT).setValue(variantLabel);
      setRow_(sh, r, 'Draft in Gmail');
      created++;
    }
  });

  ui.alert('Created ' + created + ' draft(s) in Gmail. Review them there. ' +
           'When you run "Send first emails", these previews are deleted and the emails are sent from here, so do not send the drafts by hand.');
}

/* ---------- Test Sequence ---------- */

function testSequence() {
  const ui = SpreadsheetApp.getUi();
  const tpl = templates_();
  const me = me_();
  const v = {
    'First Name': 'Test',
    'Company': 'Test Company',
    'Hook': 'This is where your hook line appears.',
    'Role_Angle': 'This is where your role angle appears.'
  };

  const testTpl = tpl.A1_A || tpl.A1;
  if (!testTpl) { ui.alert('Error: Could not find template A1 or A1_A.'); return; }

  const body = fill_(testTpl.body, v);
  const msg = GmailApp.createDraft(
    me,
    '[TEST Variant A] ' + fill_(testTpl.subject, v),
    body,
    {
      name: CFG.SENDER_NAME,
      htmlBody: buildHtmlBody_(body, 0, me)
    }
  ).send();

  Utilities.sleep(5000);
  if (tpl.A2) {
    const fu = fill_(tpl.A2.body, v);
    msg.getThread().reply(fu, { name: CFG.SENDER_NAME, htmlBody: buildHtmlBody_(fu, 0, me) });
  }

  ui.alert('Test sent to ' + me + '. Check Gmail: you should see ONE thread with two messages. ' +
           'Test emails carry no tracking and no unsubscribe link.');
}

/* ---------- First Emails (A/B Split + Tracking) ---------- */

function sendFirstEmails() {
  const ui = SpreadsheetApp.getUi();

  if (!isWithinSendingWindow_()) {
    ui.alert('Outside configured sending window (' + CFG.SEND_WINDOW_START + ':00 - ' + CFG.SEND_WINDOW_END + ':00). Sending paused.');
    return;
  }

  const sh = sheet_();
  ensureHeaders_(sh);
  const allTemplates = templates_();
  const C = CFG.COL;
  const data = sh.getDataRange().getValues();
  const room = CFG.DAILY_LIMIT - sentToday_();

  if (room <= 0) { ui.alert('Daily limit reached (' + CFG.DAILY_LIMIT + '). Try again tomorrow.'); return; }

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = String(row[C.STATUS - 1] || '').trim();
    if ((status === '' || status === 'Not started' || status === 'Draft in Gmail') && !row[C.SENT1 - 1] && ready_(row)) {
      rows.push(i);
    }
  }

  const batch = rows.slice(0, room);
  if (!batch.length) {
    ui.alert('Nothing to send. A row needs: email, first name, hook, role angle, and status "Not started".');
    return;
  }

  const names = batch.map(function (i) { return data[i][C.COMPANY - 1]; }).join(', ');
  if (ui.alert('Send Email 1 to ' + batch.length + ' contact(s) with full A/B split?\n\n' + names, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const drafts = GmailApp.getDrafts();
  let sent = 0;
  batch.forEach(function (i, n) {
    const row = data[i], r = i + 1, v = vars_(row);
    const to = String(row[C.EMAIL - 1]).trim();

    const useVariantB = Math.random() < 0.5;
    const variantKey = useVariantB ? 'A1_B' : 'A1_A';

    const tpl = allTemplates[variantKey] || allTemplates.A1;
    const variantLabel = allTemplates[variantKey] ? (useVariantB ? 'B' : 'A') : 'Default';

    if (!tpl) {
      setRow_(sh, r, 'Not started', 'Send failed: Template ' + variantKey + ' missing');
      return;
    }

    try {
      const subjectText = fill_(tpl.subject, v);
      const bodyText = fill_(tpl.body, v);
      const htmlContent = buildHtmlBody_(bodyText, r, to);

      deleteDraftsTo_(drafts, to);

      const msg = GmailApp.createDraft(to, subjectText, bodyText, {
        name: CFG.SENDER_NAME,
        htmlBody: htmlContent
      }).send();

      const today = new Date();

      sh.getRange(r, C.SENT1).setValue(today);
      sh.getRange(r, C.FU1).setValue(addDays_(today, CFG.FU1_DAYS));
      sh.getRange(r, C.FU2).setValue(addDays_(today, CFG.FU2_DAYS));
      sh.getRange(r, C.VARIANT).setValue(variantLabel);
      sh.getRange(r, C.THREAD).setValue(msg.getThread().getId());

      setRow_(sh, r, 'Email 1 sent');
      addSent_(1);
      sent++;
    } catch (err) {
      setRow_(sh, r, 'Not started', 'Send failed: ' + err.message);
    }

    SpreadsheetApp.flush();
    if (n < batch.length - 1) pause_();
  });

  ui.alert('Done. Sent ' + sent + ' email(s).');
}

/* ---------- Follow-ups and Reply Checks ---------- */

function sendDueFollowUps() { processFollowUps_(false); }

function dailyRun() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return;
  if (!isWithinSendingWindow_()) return;
  processFollowUps_(true);
}

function processFollowUps_(silent) {
  const sh = sheet_();
  const C = CFG.COL;
  const tpl = templates_();
  const me = me_();
  const data = sh.getDataRange().getValues();
  const end = new Date(); end.setHours(23, 59, 59, 999);
  let room = CFG.DAILY_LIMIT - sentToday_();
  let sent = 0, replied = 0, bounced = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i], r = i + 1;
    const status = String(row[C.STATUS - 1] || '').trim();
    const id = row[C.THREAD - 1];
    if (!id || (status !== 'Email 1 sent' && status !== 'Follow-up 1 sent')) continue;

    const st = threadState_(id, me);
    if (st.bounced) { setRow_(sh, r, 'Closed', 'Bounced, check address'); bounced++; continue; }
    if (st.replied) { setRow_(sh, r, 'Replied'); replied++; continue; }

    const isFirst = status === 'Email 1 sent';
    const dueRaw = row[(isFirst ? C.FU1 : C.FU2) - 1];
    const due = safeDate_(dueRaw);

    if (!due || due > end) continue;
    if (room <= 0) break;
    if (!ready_(row)) continue;

    const t = tpl[isFirst ? 'A2' : 'A3'];
    if (!t) continue;

    try {
      const bodyText = fill_(t.body, vars_(row));
      const htmlContent = buildHtmlBody_(bodyText, r, String(row[C.EMAIL - 1]).trim());

      GmailApp.getThreadById(id).reply(bodyText, {
        name: CFG.SENDER_NAME,
        htmlBody: htmlContent
      });

      setRow_(sh, r, isFirst ? 'Follow-up 1 sent' : 'Follow-up 2 sent');
      addSent_(1); room--; sent++;
    } catch (err) {
      sh.getRange(r, C.NOTES).setValue('Follow-up failed: ' + err.message);
    }
    SpreadsheetApp.flush();
    pause_();
  }

  if (!silent) {
    SpreadsheetApp.getUi().alert('Follow-ups sent: ' + sent + '\nNew replies: ' + replied + '\nBounces: ' + bounced);
  }
}

function checkReplies() {
  const sh = sheet_();
  const C = CFG.COL;
  const me = me_();
  const data = sh.getDataRange().getValues();
  let replied = 0, bounced = 0;

  for (let i = 1; i < data.length; i++) {
    const status = String(data[i][C.STATUS - 1] || '').trim();
    const id = data[i][C.THREAD - 1];
    if (!id || ['Email 1 sent', 'Follow-up 1 sent', 'Follow-up 2 sent'].indexOf(status) < 0) continue;

    const st = threadState_(id, me);
    if (st.bounced) { setRow_(sh, i + 1, 'Closed', 'Bounced, check address'); bounced++; }
    else if (st.replied) { setRow_(sh, i + 1, 'Replied'); replied++; }
  }

  SpreadsheetApp.getUi().alert('New replies: ' + replied + '\nBounces: ' + bounced +
                               '\n\nOut-of-office replies also count as replies, so open the threads to check.');
}

/* ---------- Analytics Dashboard Generator ---------- */

function generateCampaignStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ash = ss.getSheetByName(CFG.ANALYTICS_SHEET);
  if (!ash) {
    ash = ss.insertSheet(CFG.ANALYTICS_SHEET);
  } else {
    ash.clear();
  }

  const sh = sheet_();
  const data = sh.getDataRange().getValues().slice(1);
  const C = CFG.COL;
  const SENT_STATUSES = ['Email 1 sent', 'Follow-up 1 sent', 'Follow-up 2 sent', 'Replied', 'Call booked', 'Closed'];

  let totalSent = 0, totalOpened = 0, totalReplied = 0, totalBounced = 0, totalUnsub = 0;
  let varA_sent = 0, varA_opened = 0, varA_replied = 0;
  let varB_sent = 0, varB_opened = 0, varB_replied = 0;

  data.forEach(function (row) {
    const status = String(row[C.STATUS - 1] || '').trim();
    const variant = String(row[C.VARIANT - 1] || '').trim().toUpperCase();
    const opened = row[C.OPENED - 1];

    if (status === 'Unsubscribed') totalUnsub++;

    if (SENT_STATUSES.indexOf(status) > -1) {
      totalSent++;
      if (variant === 'A') varA_sent++;
      if (variant === 'B') varB_sent++;

      if (opened) {
        totalOpened++;
        if (variant === 'A') varA_opened++;
        if (variant === 'B') varB_opened++;
      }

      if (status === 'Replied' || status === 'Call booked') {
        totalReplied++;
        if (variant === 'A') varA_replied++;
        if (variant === 'B') varB_replied++;
      }

      if (status === 'Closed') totalBounced++;
    }
  });

  const pct = function (n, d) { return d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%'; };

  const stats = [
    ['Campaign Analytics Overview'],
    ['Generated At', new Date().toLocaleString()],
    [''],
    ['Metric', 'Count'],
    ['Total Emails Sent', totalSent],
    ['Total Opened (approximate)', totalOpened],
    ['Overall Open Rate', pct(totalOpened, totalSent)],
    ['Total Replied', totalReplied],
    ['Overall Reply Rate', pct(totalReplied, totalSent)],
    ['Bounced / Closed', totalBounced],
    ['Unsubscribed', totalUnsub],
    [''],
    ['A/B Performance Breakdown', 'Variant A', 'Variant B'],
    ['Sent', varA_sent, varB_sent],
    ['Opens', varA_opened, varB_opened],
    ['Open Rate', pct(varA_opened, varA_sent), pct(varB_opened, varB_sent)],
    ['Replies', varA_replied, varB_replied],
    ['Reply Rate', pct(varA_replied, varA_sent), pct(varB_replied, varB_sent)]
  ].map(function (r) { while (r.length < 3) r.push(''); return r; });

  ash.getRange(1, 1, stats.length, 3).setValues(stats);
  ash.getRange('A1:C1').setFontWeight('bold').setFontSize(12);
  ash.getRange('A4:C4').setFontWeight('bold').setBackground('#e0e0e0');
  ash.getRange('A13:C13').setFontWeight('bold').setBackground('#e0e0e0');
  ash.autoResizeColumns(1, 3);

  SpreadsheetApp.getUi().alert('Campaign Analytics sheet updated.');
}

/* ---------- Triggers ---------- */

function installDailyTrigger() {
  removeDailyTrigger(true);
  ScriptApp.newTrigger('dailyRun').timeBased().everyDays(1).atHour(9).create();
  SpreadsheetApp.getUi().alert('Daily follow-up trigger installed (runs weekdays around 9am).');
}

function removeDailyTrigger(quiet) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyRun') ScriptApp.deleteTrigger(t);
  });
  if (quiet !== true) SpreadsheetApp.getUi().alert('Daily follow-ups disabled.');
}