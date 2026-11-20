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
    (অনুমতির তালিকায় "ইমেইল পাঠানো" থাকবে, কারণ ভুলে গেলে তথ্য ইমেইলে পাঠানো হয়।)
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
 - Sheet-এর Password কলামে মূল পাসওয়ার্ড সরাসরি দেখা যায় (আর hash করা হয় না)।
 - User ID/পাসওয়ার্ড হারালে: লগইন পেজে "ভুলে গেছেন?" > ইমেইল দিন > User ID ও পাসওয়ার্ড
   ওই ইমেইলের inbox-এ যায় (স্ক্রিনে দেখানো হয় না)। একই ইমেইলে ৫ মিনিটে একবার।
   ফ্রি Gmail-এ দিনে প্রায় ১০০টি ইমেইল পাঠানো যায়। Spam ফোল্ডারও দেখতে বলুন।
 - অ্যাডমিন পেজে সবার পাসওয়ার্ড (👁 চাপলে দেখা যায়) এবং "পাসওয়ার্ড রিসেট" বাটন আছে।
   ইমেইল না পৌঁছালে অ্যাডমিন থেকে User ID/পাসওয়ার্ড দেখে বা নতুন পাসওয়ার্ড দিয়ে উদ্ধার করা যায়।
 - Sheet-এর Users ট্যাব শুধু আপনি (মালিক) দেখতে পারেন। কাউকে Share করবেন না।
 - সাইন আপ করলে Google Sheet-এর "Users" ট্যাবে ইমেইল, User ID, পাসওয়ার্ড (hash), Status জমা হয়।
 - ব্লক করতে: admin.html থেকে, অথবা Sheet-এর Status কলামে Blocked লিখুন (আনব্লক: Active)।
 - Excel ফাইল চাইলে: Sheet-এ File > Download > Microsoft Excel (.xlsx)।
 - আগের (hash সংস্করণের) টেস্ট ডাটা থাকলে Users ট্যাবের সারিগুলো মুছে নতুন করে সাইন আপ করুন।
 - Code.gs বদলালে: Deploy > Manage deployments > Edit > New version > Deploy (URL একই থাকে)।
