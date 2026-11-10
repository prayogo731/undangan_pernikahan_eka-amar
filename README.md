# Undangan Pernikahan Eka Oktavia & Amar Juliansyah

Website undangan digital (HTML + CSS + JavaScript, tanpa proses build) dengan database online Supabase.
Akad Nikah & Resepsi: **Sabtu, 28 November 2026**, Perumahan Bungur Raya Resident, Blok G.25, Baturaja.

## 1. Struktur folder

```
undangan-eka-amar/
├── index.html            Seluruh halaman & konten undangan
├── css/style.css         Tampilan (tema batik, responsif, animasi)
├── js/
│   ├── config.js         <- ISI DI SINI: URL & kunci Supabase
│   └── app.js            Logika: countdown, RSVP, daftar tamu realtime, ucapan
├── assets/pasangan.jpg   Ilustrasi pasangan (slot foto opsional)
├── supabase/schema.sql   Tabel, aturan keamanan, anti-spam, realtime
└── README.md             Panduan ini
```

## 2. Menghubungkan database (Supabase, gratis)

1. Buka https://supabase.com, daftar, lalu **New project** (catat password database, pilih region terdekat misalnya Singapore).
2. Tunggu proyek siap, buka **SQL Editor -> New query**.
3. Buka file `supabase/schema.sql`, salin seluruh isinya, tempel, lalu klik **Run**. Pesan "Success" berarti tabel `rsvp` dan `wishes`, aturan keamanan, anti-spam, dan realtime sudah aktif.
   (Bila muncul "already member of publication", abaikan.)
4. Buka **Project Settings -> API**. Salin:
   - **Project URL**
   - **anon public** key
5. Buka `js/config.js`, isi:
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```
   Kunci **anon** aman berada di frontend karena data dilindungi Row Level Security. **Jangan pernah** memakai kunci `service_role` di file ini.

Keamanan yang sudah diterapkan di database:
- Pengunjung hanya boleh **membaca** dan **menambah** data; ubah/hapus diblokir.
- Validasi di database: panjang nama/pesan, karakter `<` `>` ditolak, status hanya `hadir`/`tidak_hadir`, jumlah tamu 1-10.
- Satu nama hanya bisa konfirmasi satu kali (tidak peka huruf besar/kecil).
- Batas 15 kiriman per menit untuk seluruh pengunjung.
- Di frontend: kolom jebakan spam (honeypot), jeda minimal pengisian, jeda 20 detik per perangkat, dan semua teks ditampilkan sebagai teks biasa (aman dari XSS).

## 3. Menjalankan di komputer sendiri

Cukup klik dua kali `index.html`, atau lebih baik lewat server lokal:
```bash
cd undangan-eka-amar
python3 -m http.server 8080      # lalu buka http://localhost:8080
```

## 4. Hosting sampai online

Situs ini statis, jadi cukup diunggah. Pilih salah satu:

**Netlify (termudah)**
1. Buka https://app.netlify.com/drop
2. Seret folder `undangan-eka-amar` ke halaman tersebut.
3. Selesai: Anda mendapat tautan `https://namaacak.netlify.app`. Ubah nama lewat **Site configuration -> Change site name**.

**Vercel**: daftar di vercel.com, **Add New -> Project**, unggah folder (atau hubungkan GitHub), biarkan pengaturan bawaan, klik **Deploy**.

**GitHub Pages**: buat repository, unggah semua isi folder, lalu **Settings -> Pages -> Deploy from a branch -> main / root**.

Setiap kali mengubah file, unggah ulang (Netlify: seret folder lagi).

### Tautan personal per tamu (opsional)
Tambahkan `?to=Nama+Tamu` di akhir tautan, misalnya `https://situsanda.netlify.app/?to=Bapak+Andi`. Nama tampil di halaman pembuka dan terisi otomatis di formulir.

## 5. Mengatur Google Maps

- Tombol **Buka Petunjuk Arah** membuka tautan yang Anda berikan: `https://maps.app.goo.gl/kqhGAv5x5cXvaSKm9` (diatur di `MAPS_LINK`, `js/config.js`).
- Peta tertanam memakai pencarian alamat (`MAPS_EMBED_QUERY`), tanpa koordinat buatan. Tautan pendek Google tidak dapat ditanam langsung, sehingga untuk titik yang paling tepat lakukan ini:
  1. Buka tautan Maps tadi di komputer.
  2. Klik **Bagikan (Share) -> Sematkan peta (Embed a map) -> Salin HTML**.
  3. Ambil nilai di dalam `src="..."` dari kode itu, lalu di `index.html` ganti atribut `src` pada `<iframe id="mapFrame">` dan hapus baris yang mengisi `mapFrame.src` di `js/app.js`.
- Pastikan setelah online peta menampilkan lokasi yang benar. Jika kurang tepat, pakai langkah embed di atas.

## 6. Menguji RSVP & daftar tamu

1. Buka situs, klik **Buka Undangan**, gulir ke **Konfirmasi Kehadiran**.
2. Isi nama (mis. "Uji Coba"), pilih **Hadir**, 2 orang, tulis pesan, klik **Kirim Konfirmasi**. Harus muncul pemberitahuan berhasil.
3. Di bagian **Daftar Tamu**: "Tamu Konfirmasi Hadir" jadi 1, "Total Orang Hadir" jadi 2, nama muncul di **Daftar Tamu Hadir** ("Uji Coba - 2 orang"), dan pesan muncul di **Ucapan & Doa**.
4. Uji realtime: buka situs di dua tab/HP, kirim dari satu sisi, sisi lain berubah sendiri tanpa muat ulang.
5. Uji **Tidak Hadir**: nama masuk daftar tidak hadir, kolom jumlah orang tersembunyi.
6. Uji validasi: kirim ucapan kosong (ditolak), kirim nama yang sama dua kali (ditolak).
7. Cek penyimpanan permanen: Supabase **Table Editor -> rsvp / wishes**.
8. **Hapus data uji** sebelum undangan disebar: di Table Editor pilih baris lalu **Delete** (atau SQL: `delete from rsvp; delete from wishes;`).

## 7. Mengatur ulang / merawat

- Ubah teks atau jadwal langsung di `index.html`. Ubah tanggal countdown di `EVENT_START`.
- Slot foto: hapus blok `<figure class="portrait">` di `index.html` bila tidak ingin menampilkannya, atau ganti `assets/pasangan.jpg`.
- Countdown mengarah ke Akad Nikah, 28 November 2026 pukul 08.00 WIB, dan berhenti otomatis saat waktunya tiba.
- Paket gratis Supabase menjeda proyek yang tidak aktif 7 hari. Buka situs sesekali, atau tekan **Restore** di dashboard bila terjeda.


## Preview tautan saat dibagikan (WhatsApp/Facebook/dll.)

Website sudah dilengkapi metadata Open Graph dan Twitter Card serta gambar `assets/og-preview.jpg` berukuran 1200×630. Gambar preview dibuat dari foto pasangan yang sama dan **tidak ditambahkan ke galeri/foto yang tampil di halaman undangan**.

**Penting setelah website di-hosting:** crawler media sosial lebih andal jika gambar preview memakai URL HTTPS absolut. Buka `index.html`, lalu ganti isi `og:image` dan `twitter:image` dari `assets/og-preview.jpg` menjadi URL lengkap, misalnya `https://USERNAME.github.io/NAMA-REPO/assets/og-preview.jpg` (sesuaikan dengan alamat hosting sebenarnya). Pastikan URL gambar tersebut bisa dibuka langsung tanpa login. Setelah itu, gunakan fitur debug/sharing preview platform untuk meminta cache diperbarui.

Catatan: WhatsApp biasanya menampilkan preview berdasarkan metadata ini. Instagram tidak selalu menampilkan kartu preview otomatis ketika tautan dikirim lewat DM; perilakunya bergantung pada fitur Instagram.
