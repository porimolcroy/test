// Google Apps Script — Google Sheet-এ ইউজার ডাটা জমা রাখে (GitHub Pages-এর ব্যাকএন্ড)
var ADMIN_PASSWORD = "admin123";            // <-- এটি অবশ্যই বদলে নিন
var SHEET_NAME = "Users";
var HEADERS = ["User ID", "Email", "Password (Hash)", "Status", "Signup Time", "Last Login", "Session Token"];
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
      case "admin_list": return out(adminList(d));
      case "admin_block": return out(adminBlock(d, true));
      case "admin_unblock": return out(adminBlock(d, false));
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

function hex(bytes) {
  return bytes.map(function (b) { return ("0" + ((b < 0 ? b + 256 : b)).toString(16)).slice(-2); }).join("");
}
function hashPw(pw, salt) {
  var h = pw;
  for (var i = 0; i < 1000; i++) h = hex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + h + pw));
  return salt + "$" + h;
}
function newSalt() { return Utilities.getUuid().replace(/-/g, "").slice(0, 16); }

function users() {
  var vals = sheet().getDataRange().getValues(), list = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][1]) continue;
    list.push({ row: i + 1, id: String(vals[i][0]), email: String(vals[i][1]).trim().toLowerCase(),
      hash: String(vals[i][2]), status: String(vals[i][3] || "Active"),
      signup: String(vals[i][4]), last: String(vals[i][5]), token: String(vals[i][6] || "") });
  }
  return list;
}
function blocked(u) { return u.status.trim().toLowerCase() === "blocked"; }

function signup(d) {
  var email = String(d.email || "").trim().toLowerCase(), pw = String(d.password || "");
  if (!EMAIL_RE.test(email)) return { ok: false, error: "সঠিক ইমেইল দিন।" };
  if (pw.length < 6) return { ok: false, error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" };
  var us = users(), max = 0;
  for (var i = 0; i < us.length; i++) {
    if (us[i].email === email) return { ok: false, error: "এই ইমেইল দিয়ে আগেই সাইন আপ করা হয়েছে। লগইন করুন।" };
    var n = parseInt(us[i].id.slice(1), 10); if (n > max) max = n;
  }
  var id = "U" + ("0000" + (max + 1)).slice(-4), token = Utilities.getUuid() + Utilities.getUuid();
  sheet().appendRow([id, email, hashPw(pw, newSalt()), "Active", now(), now(), token]);
  return { ok: true, user_id: id, email: email, token: token };
}

function login(d) {
  var email = String(d.email || "").trim().toLowerCase(), pw = String(d.password || "");
  var us = users();
  for (var i = 0; i < us.length; i++) {
    var u = us[i];
    if (u.email !== email) continue;
    var salt = u.hash.split("$")[0];
    if (hashPw(pw, salt) !== u.hash) break;
    if (blocked(u)) return { ok: false, error: "এই ইমেইলটি ব্লক করা আছে। অ্যাডমিনের সাথে যোগাযোগ করুন।" };
    var token = Utilities.getUuid() + Utilities.getUuid();
    sheet().getRange(u.row, 6).setValue(now());
    sheet().getRange(u.row, 7).setValue(token);
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
  for (var i = 0; i < us.length; i++) if (t && us[i].token === t) sheet().getRange(us[i].row, 7).setValue("");
  return { ok: true };
}

function isAdmin(d) { return String(d.admin_password || "") === ADMIN_PASSWORD; }

function adminList(d) {
  if (!isAdmin(d)) return { ok: false, error: "অ্যাডমিন পাসওয়ার্ড ভুল।" };
  return { ok: true, users: users().map(function (u) {
    return { id: u.id, email: u.email, status: u.status, signup: u.signup, last: u.last }; }) };
}

function adminBlock(d, block) {
  if (!isAdmin(d)) return { ok: false, error: "অ্যাডমিন পাসওয়ার্ড ভুল।" };
  var email = String(d.email || "").trim().toLowerCase(), us = users();
  for (var i = 0; i < us.length; i++) if (us[i].email === email) {
    sheet().getRange(us[i].row, 4).setValue(block ? "Blocked" : "Active");
    if (block) sheet().getRange(us[i].row, 7).setValue("");
    return { ok: true };
  }
  return { ok: false, error: "ইউজার পাওয়া যায়নি।" };
}
