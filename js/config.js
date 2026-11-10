/* =====================================================================
   KONFIGURASI WEBSITE UNDANGAN
   Konfigurasi Supabase sudah diisi. Gunakan publishable key saja di frontend.

   Catatan keamanan: publishable key memang dirancang untuk berada di
   frontend. Data tetap aman karena dilindungi aturan Row Level
   Security di database (lihat supabase/schema.sql).
   JANGAN PERNAH memasukkan sb_secret / service_role key ke file ini.
   ===================================================================== */
window.APP_CONFIG = {
  SUPABASE_URL: "https://zbwtduxvjlbzjmzkybdz.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_j8YKCCXlLNDDTzERNbmadA_DbLzprVu", // publishable key

  // Tanggal & waktu acara (zona WIB = +07:00)
  EVENT_START: "2026-11-28T08:00:00+07:00",

  // Tautan Google Maps lokasi acara
  MAPS_LINK: "https://maps.app.goo.gl/kqhGAv5x5cXvaSKm9",

  // Pencarian alamat untuk peta tertanam (tanpa koordinat buatan sendiri).
  // Ganti dengan kode embed resmi dari Google Maps bila ingin lebih presisi
  // (lihat README.md, bagian Google Maps).
  MAPS_EMBED_QUERY: "Perumahan Bungur Raya Resident, Blok G.25, RT 27 RW 005, Baturaja, Sumatera Selatan"
};
