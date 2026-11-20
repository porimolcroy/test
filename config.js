// Apps Script Web App URL এখানে বসান (README দেখুন)
window.APP_URL = "https://script.google.com/macros/s/AKfycbw8h8WszHkXv3kCi8PS2Az9VMfkKaER1MIiHQys1SNqWqxg3gGjf4m5pqIgQGBU3AKVEQ/exec";

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
