import { createContext, useContext, useEffect, useState, useCallback } from "react";

const DICT = {
  id: {
    // Brand
    "brand.tagline": "Jangkau Ulang Setiap Pembeli",
    "brand.subtitleShort": "TikTok Shop CRM",

    // Nav
    "nav.dashboard": "Ikhtisar",
    "nav.upload": "Upload & Ekstraksi",
    "nav.customers": "Database Pelanggan",
    "nav.map": "Peta & Analisis Lokasi",
    "nav.creator": "Analisis Creator",
    "nav.products": "Omset per Varian",
    "nav.reminder": "Segmen Reminder",
    "nav.perluss": "Perlu Di-SS",
    "nav.segmen": "Segmen & Export",
    "nav.audit": "Riwayat Aktivitas",
    "nav.settings": "Pengaturan",
    "nav.about": "Tentang",

    // Common
    "common.logout": "Keluar",
    "common.showGuide": "Lihat panduan lagi",
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.loading": "Memuat...",
    "common.language": "Bahasa",

    // Login
    "login.hero": "Ubah screenshot pesanan jadi database pelanggan Anda sendiri.",
    "login.subhero": "TikTok Shop tidak memberi Anda akses data pembeli. PelangganKu membaca screenshot, merapikan alamat, mendeteksi pembeli berulang, dan memetakan kota mereka — semua di satu tempat.",
    "login.title": "Masuk Akun Seller",
    "login.subtitle": "Gunakan akun demo untuk mencoba semua fitur.",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Masuk",
    "login.processing": "Memproses...",
    "login.demoAccounts": "Akun Demo",
    "login.demoOwner": "Owner",
    "login.demoOperator": "Operator",
    "login.demoCount": "40+ pelanggan demo sudah tersedia",
    "login.success": "Berhasil masuk. Selamat datang!",
    "login.failed": "Gagal masuk",

    // Dashboard
    "dash.section": "Ikhtisar",
    "dash.heading": "Performa Pelanggan Anda",
    "dash.subheading": "Ringkasan pelanggan yang sudah masuk database dari screenshot & CSV TikTok Shop.",
    "dash.uploadCta": "Upload Screenshot Baru",
    "dash.tile.customers": "Total Pelanggan",
    "dash.tile.orders": "Total Pesanan",
    "dash.tile.repeat": "Pembeli Berulang",
    "dash.tile.cities": "Kota Terjangkau",
    "dash.recentCustomers": "Pelanggan Terbaru",
    "dash.viewAll": "Lihat semua",
    "dash.emptyCustomers": "Belum ada pelanggan.",
    "dash.uploadFirst": "Upload screenshot pertama",
    "dash.quickActions": "Aksi Cepat",
    "dash.qa.map": "Lihat peta lokasi pembeli",
    "dash.qa.creator": "Analisis creator affiliate",
    "dash.qa.segmen": "Buat segmen & export WA",
    "dash.qa.perluss": "Cek pesanan yang perlu di-SS",
    "dash.topProvince": "Provinsi Teratas",
    "dash.customersUnit": "pelanggan",
    "dash.repeatUnit": "pembeli berulang",
    "dash.repeatBadge": "Berulang",

    // Onboarding
    "ob.welcome": "Selamat datang di PelangganKu — Jangkau Ulang Setiap Pembeli",
    "ob.step": "Langkah {n} dari {total}",
    "ob.tip": "Tips",
    "ob.skip": "Lewati",
    "ob.back": "Kembali",
    "ob.next": "Lanjut",
    "ob.finish": "Mulai Sekarang",
    "ob.step1.title": "1. Foto Pesanan",
    "ob.step1.body": "Buka setiap pesanan di TikTok Shop, screenshot layar detail pembeli — nama, nomor HP, dan alamat lengkap ada di sana. Simpan ke galeri HP dulu.",
    "ob.step1.tip": "Kalau ada banyak, foto satu per satu — tenang, nanti bisa upload ratusan sekaligus.",
    "ob.step2.title": "2. Atau Export dari Seller Center",
    "ob.step2.body": "Di TikTok Seller Center, download data pesanan sebagai Excel atau CSV. Upload file itu di menu Perlu Di-SS untuk tahu pesanan mana yang belum Anda screenshot.",
    "ob.step2.tip": "CSV berisi kota + provinsi semua pesanan Anda — otomatis muncul di peta.",
    "ob.step3.title": "3. Data Otomatis Rapi",
    "ob.step3.body": "AI membaca setiap screenshot, memisahkan nama, telepon, dan alamat. Nomor HP sama = pelanggan sama, otomatis ditandai pembeli berulang. Klik telepon untuk chat WhatsApp langsung.",
    "ob.step3.tip": "Lihat peta Indonesia untuk tahu kota mana yang paling banyak beli produk Anda.",

    // About / Tentang
    "about.section": "Tentang",
    "about.p1": "PelangganKu adalah alat sederhana untuk seller TikTok Shop Indonesia yang tidak diberi akses ke data pembeli mereka sendiri. Aplikasi ini mengubah screenshot halaman detail pesanan menjadi database pelanggan yang bisa Anda cari, filter, dan hubungi ulang lewat WhatsApp.",
    "about.p2": "Tidak ada scraping, tidak ada akses ke API TikTok. Kami hanya membaca screenshot yang Anda upload, mengekstrak nama & alamat dengan AI, lalu menyimpannya dengan rapi — sehingga Anda tetap punya daftar pelanggan sendiri, milik Anda.",
    "about.f1.title": "Screenshot > Data",
    "about.f1.body": "Ekstrak nama, telepon +62, alamat lengkap, dan kreator afiliasi dari 1 klik.",
    "about.f2.title": "Dedupe Otomatis",
    "about.f2.body": "Nomor telepon sama = pelanggan sama. Order berulang terdeteksi otomatis.",
    "about.f3.title": "Segmen & Broadcast",
    "about.f3.body": "Filter berdasarkan kota, tag, creator, lalu siapkan daftar WhatsApp.",
    "about.demoNote": "Versi Demo: Aplikasi sudah dilengkapi ~40 pelanggan contoh dari 6 kota Indonesia. Anda bisa langsung mencoba fitur peta, filter, dan ekspor tanpa upload data terlebih dahulu.",
    "about.demoLabel": "Versi Demo:",
  },

  en: {
    "brand.tagline": "Reach Every Buyer Again",
    "brand.subtitleShort": "TikTok Shop CRM",

    "nav.dashboard": "Overview",
    "nav.upload": "Upload & Extract",
    "nav.customers": "Customer Database",
    "nav.map": "Map & Location",
    "nav.creator": "Creator Analytics",
    "nav.products": "Revenue by Variant",
    "nav.reminder": "Reminder Segments",
    "nav.perluss": "Needs Screenshot",
    "nav.segmen": "Segments & Export",
    "nav.audit": "Activity Log",
    "nav.settings": "Settings",
    "nav.about": "About",

    "common.logout": "Sign out",
    "common.showGuide": "Show guide again",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.language": "Language",

    "login.hero": "Turn order screenshots into your own customer database.",
    "login.subhero": "TikTok Shop doesn't give you access to your buyer data. PelangganKu reads screenshots, cleans up addresses, detects repeat buyers, and maps their cities — all in one place.",
    "login.title": "Sign in to Seller Account",
    "login.subtitle": "Use a demo account to try all features.",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.processing": "Processing...",
    "login.demoAccounts": "Demo Accounts",
    "login.demoOwner": "Owner",
    "login.demoOperator": "Operator",
    "login.demoCount": "40+ demo customers ready to explore",
    "login.success": "Signed in. Welcome!",
    "login.failed": "Sign in failed",

    "dash.section": "Overview",
    "dash.heading": "Your Customer Performance",
    "dash.subheading": "A summary of customers added from TikTok Shop screenshots & CSV.",
    "dash.uploadCta": "Upload New Screenshot",
    "dash.tile.customers": "Total Customers",
    "dash.tile.orders": "Total Orders",
    "dash.tile.repeat": "Repeat Buyers",
    "dash.tile.cities": "Cities Reached",
    "dash.recentCustomers": "Recent Customers",
    "dash.viewAll": "See all",
    "dash.emptyCustomers": "No customers yet.",
    "dash.uploadFirst": "Upload your first screenshot",
    "dash.quickActions": "Quick Actions",
    "dash.qa.map": "View buyer location map",
    "dash.qa.creator": "Analyze affiliate creators",
    "dash.qa.segmen": "Build segment & export WA",
    "dash.qa.perluss": "Check orders needing screenshot",
    "dash.topProvince": "Top Province",
    "dash.customersUnit": "customers",
    "dash.repeatUnit": "repeat buyers",
    "dash.repeatBadge": "Repeat",

    "ob.welcome": "Welcome to PelangganKu — Reach Every Buyer Again",
    "ob.step": "Step {n} of {total}",
    "ob.tip": "Tips",
    "ob.skip": "Skip",
    "ob.back": "Back",
    "ob.next": "Next",
    "ob.finish": "Start Now",
    "ob.step1.title": "1. Screenshot Orders",
    "ob.step1.body": "Open each order on TikTok Shop, screenshot the buyer detail screen — name, phone, and full address are right there. Save to your phone gallery first.",
    "ob.step1.tip": "Many orders? Screenshot one by one — you can upload hundreds at once later.",
    "ob.step2.title": "2. Or Export from Seller Center",
    "ob.step2.body": "In TikTok Seller Center, download orders as Excel or CSV. Upload it in Needs Screenshot to see which orders you haven't captured yet.",
    "ob.step2.tip": "CSV holds city + province for all your orders — auto-appears on the map.",
    "ob.step3.title": "3. Data Auto-Organized",
    "ob.step3.body": "AI reads each screenshot, splits out name, phone, and address. Same phone = same customer, auto-flagged as repeat buyer. Tap phone to chat on WhatsApp instantly.",
    "ob.step3.tip": "Check the Indonesia map to see which cities love your products most.",

    "about.section": "About",
    "about.p1": "PelangganKu is a simple tool for Indonesian TikTok Shop sellers who don't get access to their own buyer data. It turns order detail screenshots into a customer database you can search, filter, and reach out to via WhatsApp.",
    "about.p2": "No scraping, no TikTok API access. We only read the screenshots you upload, extract name & address with AI, and store them neatly — so you keep your own customer list, owned by you.",
    "about.f1.title": "Screenshot > Data",
    "about.f1.body": "Extract name, +62 phone, full address, and affiliate creator in one click.",
    "about.f2.title": "Auto Dedupe",
    "about.f2.body": "Same phone = same customer. Repeat orders detected automatically.",
    "about.f3.title": "Segment & Broadcast",
    "about.f3.body": "Filter by city, tag, creator, then prep your WhatsApp list.",
    "about.demoNote": "Demo Mode: The app comes with ~40 sample customers across 6 Indonesian cities. You can try map, filter, and export features immediately without uploading data first.",
    "about.demoLabel": "Demo Mode:",
  },
};

const LangCtx = createContext({ lang: "id", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("pp_lang") : null;
    return stored === "en" ? "en" : "id";
  });

  useEffect(() => {
    localStorage.setItem("pp_lang", lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l === "en" ? "en" : "id"), []);

  const t = useCallback(
    (key, vars) => {
      let s = DICT[lang]?.[key] ?? DICT.id[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [lang]
  );

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useT = () => useContext(LangCtx);
