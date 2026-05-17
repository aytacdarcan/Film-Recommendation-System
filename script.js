/* ═══════════════════════════════════════════════
   SEKANS - TÜRKÇE DESTEKLİ & EKSİKSİZ VERSİYON
═══════════════════════════════════════════════ */

const API = 'http://127.0.0.1:5000';
const TMDB = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_KEY = '5c653cc2996782bcbc43496e505b27d8'; 

let currentMovie = null;
let currentRecs = [];
let searchTimer = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// TMDB'den hem afişi hem de Türkçe bilgileri çeken fonksiyon
async function getMovieDetails(movieId) {
    if (!TMDB_API_KEY || !movieId) return null;
    try {
        // language=tr-TR ekleyerek Türkçe veri istiyoruz
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=tr-TR`);
        return await res.json();
    } catch { return null; }
}

function wireSearch(inputId, dropId, spinId, clearId, wrapId) {
    const input = $(inputId), drop = $(dropId), spin = $(spinId), clearB = $(clearId);
    input.addEventListener('input', () => {
        const q = input.value.trim();
        clearB.classList.toggle('show', q.length > 0);
        clearTimeout(searchTimer);
        drop.classList.remove('open');
        if (q.length < 1) return;
        spin.classList.add('show');
        searchTimer = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/autocomplete/${encodeURIComponent(q)}`);
                renderDrop(await res.json(), drop);
            } finally { spin.classList.remove('show'); }
        }, 280);
    });
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') drop.querySelector('.drop-item')?.click(); });
    document.addEventListener('click', e => { if (!$(wrapId).contains(e.target)) drop.classList.remove('open'); });
}

function renderDrop(items, drop) {
    if (!items.length) { drop.innerHTML = '<div class="drop-empty">Sonuç yok</div>'; drop.classList.add('open'); return; }
    drop.innerHTML = items.map(m => `
        <div class="drop-item" onclick="selectMovie(${JSON.stringify(m).replace(/"/g, '&quot;')})">
            <div class="drop-info">
                <div class="drop-title">${esc(m.title)}</div>
                <div class="drop-meta">${esc(m.year)} • ${esc(m.director)}</div>
            </div>
        </div>`).join('');
    drop.classList.add('open');
}

async function selectMovie(basic) {
    $('heroDrop').classList.remove('open'); $('mainDrop').classList.remove('open');
    $('heroScreen').classList.add('hidden'); $('mainScreen').classList.add('show');
    $('mainQ').value = basic.title; $('recsSection').classList.remove('show');
    $('filmSection').classList.add('show');
    const pw = $('posterWrap'); pw.innerHTML = ''; pw.classList.add('skeleton');
    
    try {
        const res = await fetch(`${API}/search/${encodeURIComponent(basic.title)}`);
        const data = await res.json();
        
        // TMDB'den Türkçe verileri çekiyoruz
        const trData = await getMovieDetails(basic.movie_id);
        
        currentMovie = { 
            ...data, 
            movie_id: basic.movie_id,
            overview: trData?.overview || data.overview, // Türkçe varsa onu kullan
            genres: trData?.genres ? trData.genres.map(g => g.name) : data.genres,
            poster_path: trData?.poster_path ? TMDB + trData.poster_path : null
        };
        
        renderShowcase(currentMovie);
    } catch { pw.classList.remove('skeleton'); }
}

function renderShowcase(m) {
    $('sDir').textContent = m.director; 
    $('sTitle').textContent = m.title;
    $('sYear').textContent = m.year; 
    $('sDur').textContent = `${m.runtime} dk`;
    $('sDesc').textContent = m.overview; 
    
    // Türleri (Genres) ekrana basan kısım
    $('sGenres').innerHTML = (m.genres || []).map(g => `<span class="genre-tag">${esc(g)}</span>`).join('');
    
    $('sCast').textContent = Array.isArray(m.cast) ? m.cast.join(', ') : m.cast;
    
    const pw = $('posterWrap');
    pw.classList.remove('skeleton');
    pw.innerHTML = m.poster_path ? `<img src="${m.poster_path}">` : '🎬';
    $('ctaBtn').disabled = false;
}

async function loadRecs() {
    $('ctaBtn').disabled = true; $('ctaBtn').textContent = 'Analiz ediliyor...';
    try {
        const res = await fetch(`${API}/similar/${encodeURIComponent(currentMovie.title)}`);
        currentRecs = await res.json();
        await renderRecs(currentRecs);
        $('recsSection').scrollIntoView({ behavior: 'smooth' });
    } finally { 
        $('ctaBtn').disabled = false; 
        $('ctaBtn').innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="16"><path d="M5 3l14 9-14 9V3z"/></svg> Benzerlerini Getir`;
    }
}

async function renderRecs(list) {
    const wrap = $('recList'); $('recsSection').classList.add('show'); wrap.innerHTML = '';
    for (let i = 0; i < list.length; i++) {
        const r = list[i];
        const card = document.createElement('div');
        card.className = 'ncard';
        
        // Öneriler için de Türkçe veri ve afiş alıyoruz
        const trData = await getMovieDetails(r.movie_id);
        r.fetched_poster = trData?.poster_path ? TMDB + trData.poster_path : null;
        r.overview = trData?.overview || r.overview;
        r.genres = trData?.genres ? trData.genres.map(g => g.name) : r.genres;

        card.innerHTML = `<img src="${r.fetched_poster || ''}" onerror="this.src='';this.parentNode.innerHTML='🎞️'">
            <div class="ncard-info"><div class="n-title">${esc(r.title)}</div><div class="n-meta"><span class="n-score">%${r.score}</span> <span>${esc(r.year)}</span></div></div>`;
        card.addEventListener('click', () => openModal(i));
        wrap.appendChild(card);
        setTimeout(() => card.classList.add('in'), i * 90);
    }
}

function openModal(i) {
    const r = currentRecs[i];
    $('mTitle').textContent = r.title; 
    $('mScore').textContent = `%${r.score} Eşleşme`;
    $('mYear').textContent = r.year; 
    $('mDesc').textContent = r.overview;
    $('mDir').textContent = r.director; 
    $('mCast').textContent = Array.isArray(r.cast) ? r.cast.join(', ') : r.cast;
    $('mGenres').textContent = Array.isArray(r.genres) ? r.genres.join(', ') : r.genres;
    $('mHero').innerHTML = r.fetched_poster ? `<img src="${r.fetched_poster}">` : '🎬';
    $('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() { $('modal').classList.remove('open'); document.body.style.overflow = ''; }

// Kaybolan navigasyon fonksiyonlarını geri ekledik
function goHero() {
    $('mainScreen').classList.remove('show');
    $('heroScreen').classList.remove('hidden');
    $('heroQ').value = '';
    $('heroDrop').classList.remove('open');
}

wireSearch('heroQ', 'heroDrop', 'heroSpin', 'heroClear', 'heroWrap');
wireSearch('mainQ', 'mainDrop', 'mainSpin', 'mainClear', 'mainWrap');