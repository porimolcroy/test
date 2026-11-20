=== সেটআপ (একবারই করতে হবে, ১০ মিনিট) ===

ধাপ ১: Google Sheet ও ব্যাকএন্ড
 1. sheets.new খুলে একটি নতুন Google Sheet বানান (নাম: Users DB)।
 2. মেনু: Extensions > Apps Script
 3. ডিফল্ট কোড মুছে Code.gs ফাইলের সব কোড পেস্ট করুন।
 4. উপরের লাইনে ADMIN_PASSWORD = "admin123" বদলে নিজের পাসওয়ার্ড দিন। Save (Ctrl+S)।
 5. Deploy > New deployment > ধরন (গিয়ার আইকন) "Web app"
      Execute as: Me
      Who has access: Anyone
    Deploy চাপুন, অনুমতি (Authorize) দিন। ("Advanced > Go to project" এসে Allow করতে হতে পারে।)
 6. যে "Web app URL" (https://script.google.com/macros/s/.../exec) পাবেন তা কপি করুন।

ধাপ ২: config.js
 config.js খুলে PASTE_YOUR_WEB_APP_URL_HERE-এর জায়গায় ওই URL বসান।

ধাপ ৩: GitHub
 1. github.com এ নতুন repository বানান (Public)।
 2. index.html, main.html, admin.html, config.js — এই ৪টি ফাইল আপলোড করুন।
    (Code.gs ও README GitHub-এ দেওয়ার দরকার নেই।)
 3. Settings > Pages > Source: "Deploy from a branch" > main > / (root) > Save
 4. কয়েক মিনিট পর https://আপনার-নাম.github.io/রিপোর-নাম/ এ সাইন আপ পেজ খুলবে।
    অ্যাডমিন পেজ: .../admin.html

=== ব্যবহার ===
 - সাইন আপ করলে Google Sheet-এর "Users" ট্যাবে ইমেইল, User ID, পাসওয়ার্ড (hash), Status জমা হয়।
 - ব্লক করতে: admin.html থেকে, অথবা Sheet-এর Status কলামে Blocked লিখুন (আনব্লক: Active)।
 - Excel ফাইল চাইলে: Sheet-এ File > Download > Microsoft Excel (.xlsx)।
 - Code.gs বদলালে: Deploy > Manage deployments > Edit > New version > Deploy (URL একই থাকে)।
