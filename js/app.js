/* =====================================================================
   Undangan Eka Oktavia & Amar Juliansyah - logika halaman
   ===================================================================== */
(function () {
  'use strict';

  var cfg = window.APP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Utilitas
     ------------------------------------------------------------------ */
  function clean(str) {
    return String(str == null ? '' : str).replace(/[<>]/g, '').replace(/[ \t]+/g, ' ').trim();
  }
  function cleanMultiline(str) {
    return String(str == null ? '' : str).replace(/[<>]/g, '').replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function store(op, key, val) {
    try {
      if (op === 'get') return window.localStorage.getItem(key);
      if (op === 'set') window.localStorage.setItem(key, val);
    } catch (e) { /* diabaikan: mode privat */ }
    return null;
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('err', !!isErr);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4200);
  }
  /* Salin nomor rekening / GoPay */
  function copyText(text, label) {
    function ok() { toast(label + ' berhasil disalin'); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        var done = document.execCommand('copy');
        document.body.removeChild(ta);
        done ? ok() : toast('Gagal menyalin, silakan salin manual.', true);
      } catch (e) { toast('Gagal menyalin, silakan salin manual.', true); }
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else { fallback(); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (b) copyText(b.getAttribute('data-copy'), b.getAttribute('data-label') || 'Teks');
  });

  function timeAgo(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 86400 * 30) return Math.floor(s / 86400) + ' hari lalu';
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ------------------------------------------------------------------
     Nama tamu dari tautan: ?to=Nama+Tamu
     ------------------------------------------------------------------ */
  var guestParam = '';
  try { guestParam = clean(new URLSearchParams(location.search).get('to') || '').slice(0, 60); } catch (e) {}
  if (guestParam) {
    $('#guestName').textContent = guestParam;
    $('#guestBox').hidden = false;
    $('#rsvpName').value = guestParam;
    $('#wishName').value = guestParam;
  }

  /* ------------------------------------------------------------------
     Peta & tautan
     ------------------------------------------------------------------ */
  $('#mapFrame').src = 'https://maps.google.com/maps?q=' +
    encodeURIComponent(cfg.MAPS_EMBED_QUERY || 'Perumahan Bungur Raya Resident, Baturaja') +
    '&hl=id&z=16&output=embed';
  if (cfg.MAPS_LINK) $('#mapBtn').href = cfg.MAPS_LINK;

  /* ------------------------------------------------------------------
     Membuka undangan
     ------------------------------------------------------------------ */
  var cover = $('#cover');
  var autoScrollId = null;

  function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY, dist = targetY - startY, t0 = null;
    if (reduceMotion || Math.abs(dist) < 4) { window.scrollTo(0, targetY); return; }
    function stop() {
      cancelAnimationFrame(autoScrollId);
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.removeEventListener(ev, stop); });
    }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, stop, { passive: true, once: true });
    });
    function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / duration);
      window.scrollTo(0, startY + dist * ease(p));
      if (p < 1) autoScrollId = requestAnimationFrame(step); else stop();
    }
    autoScrollId = requestAnimationFrame(step);
  }

  /* Musik latar: diputar otomatis saat undangan dibuka (klik = izin dari browser) */
  var bgm = $('#bgm'), musicBtn = $('#musicBtn'), wantMusic = true;
  function setMusicUI(on) {
    musicBtn.classList.toggle('muted', !on);
    musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    musicBtn.setAttribute('aria-label', on ? 'Matikan musik' : 'Putar musik');
  }
  function playMusic() {
    bgm.volume = 0;
    var pr = bgm.play();
    var fade = function () {
      var v = 0, t = setInterval(function () { v = Math.min(.8, v + .05); bgm.volume = v; if (v >= .8) clearInterval(t); }, 150);
    };
    // jika browser menolak autoplay, coba lagi pada interaksi pertama berikutnya
    var retry = function () {
      if (!wantMusic || !bgm.paused) return;
      bgm.volume = 0;
      bgm.play().then(function () { setMusicUI(true); fade(); }, function () {});
    };
    var blocked = function () {
      setMusicUI(false);
      ['touchstart', 'click', 'scroll', 'keydown'].forEach(function (ev) {
        window.addEventListener(ev, retry, { passive: true, once: true });
      });
    };
    if (pr && pr.then) pr.then(function () { setMusicUI(true); fade(); }, blocked);
    else { setMusicUI(true); fade(); }
  }
  musicBtn.addEventListener('click', function () {
    if (bgm.paused) { wantMusic = true; bgm.volume = .8; bgm.play().then(function () { setMusicUI(true); }, function () {}); }
    else { wantMusic = false; bgm.pause(); setMusicUI(false); }
  });
  // jeda saat tab disembunyikan / layar dikunci, lanjut lagi saat kembali
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) bgm.pause();
    else if (wantMusic && !musicBtn.hidden) bgm.play().catch(function () {});
  });

  $('#openBtn').addEventListener('click', function () {
    musicBtn.hidden = false;
    playMusic();
    cover.classList.add('opening');
    startPetals();
    // animasi bagian pertama dimulai setelah pintu terbuka
    setTimeout(function () { reveals.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in'); }); }, 900);
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    setTimeout(function () {
      var target = $('#pembuka');
      var nav = $('#nav');
      var offset = window.innerWidth >= 900 ? nav.offsetHeight : 0;
      smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - offset, 2600);
    }, reduceMotion ? 0 : 1500);
    setTimeout(function () { cover.classList.add('gone'); }, reduceMotion ? 0 : 1900);
  });

  /* ------------------------------------------------------------------
     Animasi saat gulir: muncul & menghilang, ke bawah maupun ke atas
     ------------------------------------------------------------------ */
  var reveals = $$('.reveal');
  // jeda bertahap (stagger) antar saudara yang sama
  var groups = new Map();
  reveals.forEach(function (el) {
    var k = el.parentElement;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(el);
  });
  groups.forEach(function (list) {
    list.forEach(function (el, i) {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 0.13).toFixed(2) + 's');
    });
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          if (!document.body.classList.contains('locked')) el.classList.add('in');
        } else if (!document.body.classList.contains('locked')) {
          // keluar lewat atas => saat kembali, masuk dari atas
          el.classList.toggle('top', e.boundingClientRect.top < 0);
          el.classList.remove('in');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Progres gulir + parallax mawar & foto */
  var bar = $('#progressBar');
  var pars = $$('[data-speed],[data-par]');
  var vh = window.innerHeight;
  function frame() {
    var y = window.scrollY, max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (reduceMotion) return;
    pars.forEach(function (el) {
      var host = el.closest('section,header,footer,.cover') || el.parentElement;
      var r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var mid = (el.getAttribute('data-par') !== null ? el.parentElement : host).getBoundingClientRect();
      var off = (mid.top + mid.height / 2) - vh / 2;
      if (el.hasAttribute('data-par')) {
        el.style.transform = 'translate3d(0,' + (off * parseFloat(el.getAttribute('data-par'))).toFixed(1) + 'px,0) scale(' + (el.getAttribute('data-scale') || 1) + ')';
      } else {
        var sp = parseFloat(el.getAttribute('data-speed'));
        el.style.transform = 'translate3d(0,' + (off * sp * -1.6).toFixed(1) + 'px,0) rotate(' + (off * sp * -0.05).toFixed(2) + 'deg)';
      }
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { frame(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); });
  frame();

  /* Kelopak mawar berjatuhan (mulai setelah undangan dibuka) */
  var petalsOn = false;
  function startPetals() {
    if (petalsOn || reduceMotion) return;
    petalsOn = true;
    var box = $('#petals'), n = window.innerWidth < 640 ? 12 : 22;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      p.className = 'petal';
      p.style.left = (Math.random() * 100).toFixed(1) + '%';
      p.style.setProperty('--w', (9 + Math.random() * 11).toFixed(1) + 'px');
      p.style.setProperty('--dur', (11 + Math.random() * 10).toFixed(1) + 's');
      p.style.setProperty('--del', (-Math.random() * 18).toFixed(1) + 's');
      p.style.setProperty('--sw', ((Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 90)).toFixed(0) + 'px');
      box.appendChild(p);
    }
  }

  /* ------------------------------------------------------------------
     Navigasi: tandai bagian aktif
     ------------------------------------------------------------------ */
  var navMap = { beranda: 'beranda', pembuka: 'beranda', mempelai: 'mempelai', countdown: 'acara',
    acara: 'acara', lokasi: 'lokasi', rsvp: 'rsvp', daftar: 'rsvp', ucapan: 'ucapan' };
  var navLinks = $$('.nav a');
  function markNav() {
    var y = window.scrollY + window.innerHeight * 0.4, current = 'beranda';
    Object.keys(navMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) current = navMap[id];
    });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.dataset.nav === current); });
  }
  var navTick = false;
  window.addEventListener('scroll', function () {
    if (navTick) return;
    navTick = true;
    requestAnimationFrame(function () { markNav(); navTick = false; });
  }, { passive: true });
  markNav();

  /* ------------------------------------------------------------------
     Countdown
     ------------------------------------------------------------------ */
  var target = new Date(cfg.EVENT_START || '2026-11-28T08:00:00+07:00').getTime();
  var cdTimer;
  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      clearInterval(cdTimer);
      $('#countdown-box').hidden = true;
      $('#cd-done').hidden = false;
      return;
    }
    var s = Math.floor(diff / 1000);
    $('#cd-d').textContent = pad(Math.floor(s / 86400));
    $('#cd-h').textContent = pad(Math.floor((s % 86400) / 3600));
    $('#cd-m').textContent = pad(Math.floor((s % 3600) / 60));
    $('#cd-s').textContent = pad(s % 60);
  }
  tick();
  cdTimer = setInterval(tick, 1000);

  /* ------------------------------------------------------------------
     Database (Supabase)
     ------------------------------------------------------------------ */
  var sb = null;
  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient) {
    try { sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY); }
    catch (e) { console.error('Gagal membuat klien Supabase:', e); }
  }
  var rsvps = [], wishes = [];

  function setLive(on, text) {
    $('.live').classList.toggle('on', !!on);
    $('#liveText').textContent = text;
  }

  /* ----- Render ----- */
  var LIMIT_LIST = 8, LIMIT_WISH = 6;
  var showAll = { hadir: false, tidak: false }, wishLimit = LIMIT_WISH;

  function byNewest(a, b) { return new Date(b.created_at) - new Date(a.created_at); }

  function renderList(listEl, emptyEl, moreBtn, items, key, withCount) {
    listEl.textContent = '';
    items.forEach(function (r, i) {
      var li = document.createElement('li');
      var n = document.createElement('span'); n.className = 'gn'; n.textContent = r.name;
      li.appendChild(n);
      if (withCount) {
        var c = document.createElement('span'); c.className = 'gc'; c.textContent = '– ' + r.guests + ' orang';
        li.appendChild(c);
      }
      if (!showAll[key] && i >= LIMIT_LIST) li.classList.add('hide');
      listEl.appendChild(li);
    });
    emptyEl.hidden = items.length > 0;
    moreBtn.hidden = items.length <= LIMIT_LIST;
    moreBtn.textContent = showAll[key] ? 'Tampilkan lebih sedikit' : 'Tampilkan semua (' + items.length + ')';
  }

  function renderWishes() {
    var feed = [];
    wishes.forEach(function (w) { feed.push({ id: 'w' + w.id, name: w.name, message: w.message, created_at: w.created_at }); });
    rsvps.forEach(function (r) {
      if (r.message && r.message.trim()) feed.push({ id: 'r' + r.id, name: r.name, message: r.message, created_at: r.created_at });
    });
    feed.sort(byNewest);

    var box = $('#wishFeed');
    box.textContent = '';
    feed.forEach(function (f, i) {
      var card = document.createElement('article');
      card.className = 'wish' + (i >= wishLimit ? ' hide' : '');
      var p = document.createElement('p'); p.textContent = f.message;
      var foot = document.createElement('footer');
      var b = document.createElement('b'); b.textContent = f.name;
      var t = document.createElement('time'); t.dateTime = f.created_at; t.textContent = timeAgo(f.created_at);
      foot.appendChild(b); foot.appendChild(t);
      card.appendChild(p); card.appendChild(foot);
      box.appendChild(card);
    });
    $('#emptyWish').hidden = feed.length > 0;
    $('#moreWish').hidden = feed.length <= wishLimit;
    return feed.length;
  }

  function render() {
    var hadir = rsvps.filter(function (r) { return r.status === 'hadir'; }).sort(byNewest);
    var tidak = rsvps.filter(function (r) { return r.status === 'tidak_hadir'; }).sort(byNewest);
    var orang = hadir.reduce(function (sum, r) { return sum + (Number(r.guests) || 0); }, 0);

    renderList($('#listHadir'), $('#emptyHadir'), $('#moreHadir'), hadir, 'hadir', true);
    renderList($('#listTidak'), $('#emptyTidak'), $('#moreTidak'), tidak, 'tidak', false);
    var totalWish = renderWishes();

    $('#st-hadir').textContent = hadir.length;
    $('#st-orang').textContent = orang;
    $('#st-tidak').textContent = tidak.length;
    $('#st-ucapan').textContent = totalWish;
  }

  $('#moreHadir').addEventListener('click', function () { showAll.hadir = !showAll.hadir; render(); });
  $('#moreTidak').addEventListener('click', function () { showAll.tidak = !showAll.tidak; render(); });
  $('#moreWish').addEventListener('click', function () { wishLimit += LIMIT_WISH; render(); });

  /* ----- Memuat & realtime ----- */
  function upsert(arr, row) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === row.id) { arr[i] = row; return; }
    arr.push(row);
  }

  function loadAll() {
    if (!sb) return Promise.resolve();
    return Promise.all([
      sb.from('rsvp').select('id,name,guests,status,message,created_at').order('created_at', { ascending: false }).limit(2000),
      sb.from('wishes').select('id,name,message,created_at').order('created_at', { ascending: false }).limit(2000)
    ]).then(function (res) {
      if (res[0].error || res[1].error) throw (res[0].error || res[1].error);
      rsvps = res[0].data || [];
      wishes = res[1].data || [];
      render();
    });
  }

  if (!sb) {
    setLive(false, 'Database belum terhubung. Isi js/config.js.');
    render();
  } else {
    loadAll().then(function () {
      setLive(true, 'Terhubung · diperbarui otomatis');
    }).catch(function (err) {
      console.error(err);
      setLive(false, 'Gagal memuat data. Periksa koneksi atau pengaturan database.');
    });

    // Realtime: tamu baru langsung muncul tanpa muat ulang
    sb.channel('undangan-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rsvp' }, function (p) { upsert(rsvps, p.new); render(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, function (p) { upsert(wishes, p.new); render(); })
      .subscribe(function (status) {
        if (status === 'SUBSCRIBED') setLive(true, 'Terhubung · diperbarui otomatis');
      });

    // Cadangan: muat ulang berkala bila realtime tidak aktif / terputus
    setInterval(function () { if (!document.hidden) loadAll().catch(function () {}); }, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadAll().catch(function () {}); });
  }

  // Perbarui label waktu ("2 menit lalu")
  setInterval(function () { if (!document.hidden) renderWishes(); }, 60000);

  /* ------------------------------------------------------------------
     Formulir (umum)
     ------------------------------------------------------------------ */
  var MIN_FILL_MS = 2500;        // manusia butuh waktu untuk mengisi
  var COOLDOWN_MS = 20000;       // jeda antar pengiriman dari perangkat yang sama
  var rsvpOpenedAt = Date.now(), wishOpenedAt = Date.now();

  function showErr(id, msg) {
    var el = $(id);
    el.textContent = msg;
    el.hidden = !msg;
  }
  function markInvalid(input, bad) {
    var f = input.closest('.field');
    if (f) f.classList.toggle('invalid', !!bad);
  }
  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.textContent = busy ? 'Mengirim…' : label;
  }
  function dbError(err) {
    var code = err && err.code, msg = (err && err.message) || '';
    if (code === '23505') return 'Nama ini sudah pernah mengonfirmasi kehadiran.';
    if (code === 'P0001' || /terlalu banyak/i.test(msg)) return 'Terlalu banyak kiriman saat ini. Mohon coba lagi sebentar lagi.';
    if (code === '23514') return 'Data tidak valid. Periksa kembali nama dan pesan Anda.';
    return 'Terjadi kendala saat mengirim. Silakan coba lagi.';
  }
  function cooldownLeft(kind) {
    var last = Number(store('get', 'undangan:last:' + kind) || 0);
    return Math.max(0, COOLDOWN_MS - (Date.now() - last));
  }
  function counter(textarea, out) {
    function upd() { out.textContent = textarea.value.length + ' / 500'; }
    textarea.addEventListener('input', upd); upd();
    return upd;
  }

  /* ------------------------------------------------------------------
     RSVP
     ------------------------------------------------------------------ */
  var rsvpForm = $('#rsvpForm');
  var rsvpUpd = counter($('#rsvpMsg'), $('#rsvpCount'));

  function syncStatus() {
    var attending = rsvpForm.elements.status.value === 'hadir';
    $('#guestsField').hidden = !attending;
  }
  $$('input[name=status]', rsvpForm).forEach(function (r) { r.addEventListener('change', syncStatus); });
  syncStatus();

  rsvpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('#rsvpError', '');
    if (rsvpForm.elements.website.value) return;                       // jebakan spam
    if (Date.now() - rsvpOpenedAt < MIN_FILL_MS) { showErr('#rsvpError', 'Mohon periksa kembali isian Anda lalu kirim.'); return; }

    var nameEl = rsvpForm.elements.name;
    var name = clean(nameEl.value);
    var status = rsvpForm.elements.status.value;
    var guests = status === 'hadir' ? parseInt(rsvpForm.elements.guests.value, 10) : 0;
    var message = cleanMultiline(rsvpForm.elements.message.value);

    var bad = name.length < 2 || name.length > 60;
    markInvalid(nameEl, bad);
    if (bad) { showErr('#rsvpError', 'Nama wajib diisi (2 sampai 60 karakter).'); nameEl.focus(); return; }
    if (status === 'hadir' && !(guests >= 1 && guests <= 10)) { showErr('#rsvpError', 'Jumlah tamu harus antara 1 dan 10 orang.'); return; }
    if (message.length > 500) { showErr('#rsvpError', 'Pesan maksimal 500 karakter.'); return; }
    if (!sb) { showErr('#rsvpError', 'Database belum terhubung. Hubungi penyelenggara.'); return; }
    var wait = cooldownLeft('rsvp');
    if (wait) { showErr('#rsvpError', 'Mohon tunggu ' + Math.ceil(wait / 1000) + ' detik sebelum mengirim lagi.'); return; }

    var btn = $('#rsvpBtn');
    setBusy(btn, true, 'Kirim Konfirmasi');
    sb.from('rsvp')
      .insert({ name: name, guests: guests, status: status, message: message || null })
      .select('id,name,guests,status,message,created_at').single()
      .then(function (res) {
        if (res.error) throw res.error;
        store('set', 'undangan:last:rsvp', String(Date.now()));
        upsert(rsvps, res.data); render();
        $('#rsvpSuccessText').textContent = status === 'hadir'
          ? 'Terima kasih, ' + name + '. Konfirmasi kehadiran Anda (' + guests + ' orang) telah kami terima. Sampai jumpa di hari bahagia kami.'
          : 'Terima kasih, ' + name + '. Konfirmasi Anda telah kami terima. Doa restu Anda sangat berarti bagi kami.';
        rsvpForm.hidden = true;
        $('#rsvpSuccess').hidden = false;
        toast('Konfirmasi berhasil dikirim. Terima kasih!');
      })
      .catch(function (err) {
        console.error(err);
        showErr('#rsvpError', dbError(err));
        toast(dbError(err), true);
      })
      .then(function () { setBusy(btn, false, 'Kirim Konfirmasi'); });
  });

  $('#rsvpAgain').addEventListener('click', function () {
    rsvpForm.reset();
    rsvpUpd(); syncStatus();
    rsvpOpenedAt = Date.now();
    $('#rsvpSuccess').hidden = true;
    rsvpForm.hidden = false;
    rsvpForm.elements.name.focus();
  });

  /* ------------------------------------------------------------------
     Ucapan & doa
     ------------------------------------------------------------------ */
  var wishForm = $('#wishForm');
  var wishUpd = counter($('#wishMsg'), $('#wishCount'));

  wishForm.addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('#wishError', '');
    if (wishForm.elements.website.value) return;
    if (Date.now() - wishOpenedAt < MIN_FILL_MS) { showErr('#wishError', 'Mohon periksa kembali isian Anda lalu kirim.'); return; }

    var nameEl = wishForm.elements.name, msgEl = wishForm.elements.message;
    var name = clean(nameEl.value), message = cleanMultiline(msgEl.value);

    var badName = name.length < 2 || name.length > 60;
    var badMsg = message.length < 3 || message.length > 500;
    markInvalid(nameEl, badName); markInvalid(msgEl, badMsg);
    if (badName) { showErr('#wishError', 'Nama wajib diisi (2 sampai 60 karakter).'); nameEl.focus(); return; }
    if (badMsg) { showErr('#wishError', message.length ? 'Ucapan minimal 3 dan maksimal 500 karakter.' : 'Ucapan tidak boleh kosong.'); msgEl.focus(); return; }
    if (!sb) { showErr('#wishError', 'Database belum terhubung. Hubungi penyelenggara.'); return; }
    var wait = cooldownLeft('wish');
    if (wait) { showErr('#wishError', 'Mohon tunggu ' + Math.ceil(wait / 1000) + ' detik sebelum mengirim lagi.'); return; }

    var btn = $('#wishBtn');
    setBusy(btn, true, 'Kirim Ucapan');
    sb.from('wishes').insert({ name: name, message: message })
      .select('id,name,message,created_at').single()
      .then(function (res) {
        if (res.error) throw res.error;
        store('set', 'undangan:last:wish', String(Date.now()));
        upsert(wishes, res.data); render();
        msgEl.value = ''; wishUpd();
        wishOpenedAt = Date.now();
        toast('Ucapan Anda berhasil dikirim. Terima kasih!');
      })
      .catch(function (err) {
        console.error(err);
        showErr('#wishError', dbError(err));
        toast(dbError(err), true);
      })
      .then(function () { setBusy(btn, false, 'Kirim Ucapan'); });
  });

  [rsvpForm.elements.name, wishForm.elements.name, wishForm.elements.message].forEach(function (el) {
    el.addEventListener('input', function () { markInvalid(el, false); });
  });
})();
