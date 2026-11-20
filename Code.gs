// Google Apps Script — Google Sheet-এ ইউজার ডাটা জমা রাখে (GitHub Pages-এর ব্যাকএন্ড)
var ADMIN_PASSWORD = "admin123";            // <-- এটি অবশ্যই বদলে নিন
var SITE_NAME = "আমার সাইট";                 // ইমেইলে যে নাম দেখাবে
var SHEET_NAME = "Users";
var HEADERS = ["User ID", "Email", "Password", "Status", "Signup Time", "Last Login", "Session Token"];
var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function doGet() { return out({ ok: true, msg: "Server চালু আছে" }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents || "{}");
    switch (d.action) {
      case "signup": return out(signup(d));
      case "login": return out(login(d));
      case "verify": return out(verify(d));
      case "logout": return out(logout(d));
      case "forgot": return out(forgot(d));
      case "admin_list": return out(adminList(d));
      case "admin_block": return out(adminBlock(d, true));
      case "admin_unblock": return out(adminBlock(d, false));
      case "admin_set_password": return out(adminSetPassword(d));
      default: return out({ ok: false, error: "অজানা অনুরোধ" });
    }
  } catch (err) {
    return out({ ok: false, error: "সার্ভার সমস্যা: " + err });
  } finally { lock.releaseLock(); }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function now() { return Utilities.formatDate(new Date(), "Asia/Dhaka", "yyyy-MM-dd HH:mm:ss"); }

// সব মান টেক্সট হিসেবে লেখা হয়, যাতে "007123" এর মতো পাসওয়ার্ডের শূন্য হারিয়ে না যায়
function setText(row, col, val) {
  var rg = sheet().getRange(row, col, 1, 1);
  rg.setNumberFormat("@"); rg.setValues([[String(val)]]);
}
function addRow(arr) {
  var sh = sheet(), r = sh.getLastRow() + 1;
  var rg = sh.getRange(r, 1, 1, arr.length);
  rg.setNumberFormat("@"); rg.setValues([arr.map(String)]);
}

function users() {
  var vals = sheet().getDataRange().getValues(), list = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][1]) continue;
    list.push({ row: i + 1, id: String(vals[i][0]), email: String(vals[i][1]).trim().toLowerCase(),
      pw: String(vals[i][2]), status: String(vals[i][3] || "Active"),
      signup: String(vals[i][4]), last: String(vals[i][5]), token: String(vals[i][6] || "") });
  }
  return list;
}
function blocked(u) { return u.status.trim().toLowerCase() === "blocked"; }
function newToken() { return Utilities.getUuid() + Utilities.getUuid(); }

function signup(d) {
  var email = String(d.email || "").trim().toLowerCase(), pw = String(d.password || "");
  if (!EMAIL_RE.test(email)) return { ok: false, error: "সঠিক ইমেইল দিন।" };
  if (pw.length < 6) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" };
  var us = users(), max = 0;
  for (var i = 0; i < us.length; i++) {
    if (us[i].email === email) return { ok: false, error: "এই ইমেইল দিয়ে আগেই সাইন আপ করা হয়েছে। লগইন করুন।" };
    var n = parseInt(us[i].id.slice(1), 10); if (n > max) max = n;
  }
  var id = "U" + ("0000" + (max + 1)).slice(-4), token = newToken();
  addRow([id, email, pw, "Active", now(), now(), token]);
  return { ok: true, user_id: id, email: email, token: token };
}

function login(d) {
  var email = String(d.email || "").trim().toLowerCase(), pw = String(d.password || "");
  var us = users();
  for (var i = 0; i < us.length; i++) {
    var u = us[i];
    if (u.email !== email) continue;
    if (u.pw !== pw) break;
    if (blocked(u)) return { ok: false, error: "এই ইমেইলটি ব্লক করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।" };
    var token = newToken();
    setText(u.row, 6, now()); setText(u.row, 7, token);
    return { ok: true, user_id: u.id, email: u.email, token: token };
  }
  return { ok: false, error: "ইমেইল বা পাসওয়ার্ড ভুল।" };
}

function verify(d) {
  var t = String(d.token || "");
  if (t.length < 20) return { ok: false };
  var us = users();
  for (var i = 0; i < us.length; i++)
    if (us[i].token === t && !blocked(us[i])) return { ok: true, user_id: us[i].id, email: us[i].email };
  return { ok: false };
}

function logout(d) {
  var t = String(d.token || ""), us = users();
  for (var i = 0; i < us.length; i++) if (t && us[i].token === t) setText(us[i].row, 7, "");
  return { ok: true };
}

// ভুলে গেলে: User ID ও পাসওয়ার্ড শুধু নিবন্ধিত ইমেইলের ইনবক্সে পাঠানো হয় (স্ক্রিনে দেখানো হয় না)
function forgot(d) {
  var email = String(d.email || "").trim().toLowerCase();
  var generic = { ok: true, msg: "ইমেইলটি নিবন্ধিত থাকলে User ID ও পাসওয়ার্ড সেই ইমেইলে পাঠানো হয়েছে। Inbox/Spam দেখুন।" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "সঠিক ইমেইল দিন।" };
  var cache = CacheService.getScriptCache(), key = "fp_" + email;
  if (cache.get(key)) return { ok: false, error: "একটু আগেই অনুরোধ করা হয়েছে। ৫ মিনিট পর আবার চেষ্টা করুন।" };
  var us = users();
  for (var i = 0; i < us.length; i++) {
    if (us[i].email !== email) continue;
    if (blocked(us[i])) return generic;
    cache.put(key, "1", 300);
    MailApp.sendEmail(email, SITE_NAME + " — আপনার লগইন তথ্য",
      "আপনার লগইন তথ্য:\n\nUser ID: " + us[i].id + "\nইমেইল: " + us[i].email +
      "\nপাসওয়ার্ড: " + us[i].pw + "\n\nআপনি অনুরোধ না করলে এই ইমেইলটি উপেক্ষা করুন।");
    return generic;
  }
  return generic;
}

function isAdmin(d) { return String(d.admin_password || "") === ADMIN_PASSWORD; }
var ADMIN_ERR = { ok: false, error: "অ্যাডমিন পাসওয়ার্ড ভুল।" };

function adminList(d) {
  if (!isAdmin(d)) return ADMIN_ERR;
  return { ok: true, users: users().map(function (u) {
    return { id: u.id, email: u.email, password: u.pw, status: u.status, signup: u.signup, last: u.last }; }) };
}

function adminBlock(d, block) {
  if (!isAdmin(d)) return ADMIN_ERR;
  var email = String(d.email || "").trim().toLowerCase(), us = users();
  for (var i = 0; i < us.length; i++) if (us[i].email === email) {
    setText(us[i].row, 4, block ? "Blocked" : "Active");
    if (block) setText(us[i].row, 7, "");
    return { ok: true };
  }
  return { ok: false, error: "ইউজার পাওয়া যায়নি।" };
}

function adminSetPassword(d) {
  if (!isAdmin(d)) return ADMIN_ERR;
  var email = String(d.email || "").trim().toLowerCase(), pw = String(d.new_password || "");
  if (pw.length < 6) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" };
  var us = users();
  for (var i = 0; i < us.length; i++) if (us[i].email === email) {
    setText(us[i].row, 3, pw); setText(us[i].row, 7, "");   // পুরনো লগইন সেশন বাতিল
    return { ok: true };
  }
  return { ok: false, error: "ইউজার পাওয়া যায়নি।" };
}
