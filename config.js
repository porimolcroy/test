// Apps Script Web App URL এখানে বসান (README দেখুন)
window.APP_URL = "https://script.google.com/macros/s/AKfycbxPNJ6XZzH0yejg902VE1tCtuSICZmvZEjvF0yYofpTYythJOgf227GLWf3fhewsZOBaQ/exec";

window.api = async function (data) {
  if (!window.APP_URL || window.APP_URL.indexOf("PASTE_") === 0)
    return { ok: false, error: "config.js-এ Web App URL বসানো হয়নি।" };
  try {
    // Content-Type না দিলে ব্রাউজার "simple request" পাঠায়, তাই CORS সমস্যা হয় না
    const r = await fetch(window.APP_URL, { method: "POST", body: JSON.stringify(data) });
    return await r.json();
  } catch (e) {
    return { ok: false, error: "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট/URL যাচাই করুন।" };
  }
};
