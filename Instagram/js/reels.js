const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = getCurrentUser();
let currentUserData = null;
let reelsCache = [];
let page = 0;
let loading = false;
let allLoaded = false;

function getCurrentUser() {
  return localStorage.getItem('usuario');
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil';
  return n.toString();
}

async function cargarReels() {
  if (loading || allLoaded) return;
  loading = true;
  page++;
  const { data: reels } = await supabase.from('reels').select('*').order('created_at', { ascending: false }).range((page - 1) * 5, page * 5 - 1);
  if (!reels || reels.length === 0) { allLoaded = true; loading = false; return; }
  reelsCache = [...reelsCache, ...reels];
  renderReels();
  loading = false;
}

async function renderReels() {
  const container = document.getElementById('reelsFeed');
  let html = '';
  for (const reel of reelsCache) {
    const autor = await getUserData(reel.username);
    const likesCount = await getReelLikes(reel.id);
    const userLiked = await userLikedReel(reel.id, currentUser);
    const commentCount = await getReelCommentsCount(reel.id);
    html += `
      <div class="reel" data-reel-id="${reel.id}">
        <video src="${reel.url}" loop playsinline preload="metadata"></video>
        <div class="reel-info">
          <div class="reel-user">
            <img src="${autor?.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="">
            <span>${reel.username}</span>
            <span style="font-size:12px;font-weight:400;color:#a8a8a8;margin-left:4px;">• ${timeAgo(reel.created_at)}</span>
          </div>
          <div class="reel-caption">${reel.descripcion || ''}</div>
          <div class="reel-music"><i class="fa-solid fa-music"></i> ${reel.musica || 'Sonido original'}</div>
        </div>
        <div class="reel-actions">
          <button class="like-reel-btn ${userLiked ? 'liked' : ''}" data-id="${reel.id}">
            <i class="fa-${userLiked ? 'solid' : 'regular'} fa-heart"></i>
            <span>${formatNum(likesCount)}</span>
          </button>
          <button class="comment-reel-btn" data-id="${reel.id}">
            <i class="fa-regular fa-comment"></i>
            <span>${formatNum(commentCount)}</span>
          </button>
          <button class="share-reel-btn"><i class="fa-regular fa-paper-plane"></i><span>Compartir</span></button>
          <button class="save-reel-btn"><i class="fa-regular fa-bookmark"></i><span>Guardar</span></button>
          <button class="more-reel-btn"><i class="fa-solid fa-ellipsis"></i></button>
        </div>
        <div class="reel-input">
          <input type="text" placeholder="Agrega un comentario..." class="reel-comment-input">
          <button class="reel-comment-btn">Publicar</button>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  attachReelEvents();
  observeReels();
}

function attachReelEvents() {
  const user = currentUser;
  // Like
  document.querySelectorAll('.like-reel-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const icon = btn.querySelector('i');
      const span = btn.querySelector('span');
      const liked = icon.classList.contains('fa-solid');
      if (!liked) {
        await supabase.from('reels_likes').insert({ user_id: user, video_id: id, username: user, reel_author: btn.closest('.reel')?.querySelector('.reel-user span')?.textContent || '' });
        icon.className = 'fa-solid fa-heart'; btn.classList.add('liked');
        span.textContent = formatNum(parseInt(span.textContent.replace(/[^0-9]/g, '')) + 1);
      } else {
        await supabase.from('reels_likes').delete().eq('user_id', user).eq('video_id', id);
        icon.className = 'fa-regular fa-heart'; btn.classList.remove('liked');
        span.textContent = formatNum(Math.max(0, parseInt(span.textContent.replace(/[^0-9]/g, '')) - 1));
      }
    };
  });
  // Comment
  document.querySelectorAll('.reel-comment-btn').forEach(btn => {
    btn.onclick = async () => {
      const input = btn.closest('.reel-input').querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      const reelId = btn.closest('.reel').dataset.reelId;
      await supabase.from('comentarios').insert([{ post_id: reelId, username: user, texto: text, created_at: new Date() }]);
      input.value = '';
    };
  });
  // Play/pause on tap
  document.querySelectorAll('.reel video').forEach(v => {
    v.addEventListener('click', (e) => {
      if (e.target.closest('.reel-actions') || e.target.closest('.reel-input')) return;
      if (v.paused) v.play(); else v.pause();
    });
  });
}

function observeReels() {
  const videos = document.querySelectorAll('.reel video');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
        video.muted = false;
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });
  videos.forEach(v => observer.observe(v));
}

async function getUserData(username) {
  const { data } = await supabase.from('usuarios').select('username,foto,estado').eq('username', username).maybeSingle();
  return data;
}

async function getReelLikes(reelId) {
  const { count } = await supabase.from('reels_likes').select('*', { count: 'exact', head: true }).eq('video_id', reelId);
  return count || 0;
}

async function userLikedReel(reelId, username) {
  const { data } = await supabase.from('reels_likes').select('id').eq('user_id', username).eq('video_id', reelId).maybeSingle();
  return !!data;
}

async function getReelCommentsCount(reelId) {
  const { count } = await supabase.from('comentarios').select('*', { count: 'exact', head: true }).eq('post_id', reelId);
  return count || 0;
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  return `hace ${Math.floor(diff/86400)} d`;
}

// Infinite scroll
const scrollObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !loading && !allLoaded) cargarReels();
}, { threshold: 0.1 });

async function init() {
  currentUser = getCurrentUser();
  if (currentUser) {
    const { data } = await supabase.from('usuarios').select('*').eq('username', currentUser).maybeSingle();
    currentUserData = data;
    // Set nav avatar
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar && data?.foto) navAvatar.src = data.foto;
  }
  // Load reels from DB first
  const { data: dbReels } = await supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(10);
  if (dbReels && dbReels.length > 0) {
    reelsCache = dbReels;
    renderReels();
  } else {
    // If no reels in DB, use Pexels as fallback
    await cargarReelsPexels();
  }
  // Sentinel for infinite scroll
  const sentinel = document.createElement('div');
  sentinel.style.height = '10px';
  sentinel.id = 'reel-sentinel';
  document.getElementById('reelsFeed').appendChild(sentinel);
  scrollObserver.observe(sentinel);

  // Search btn
  document.getElementById('searchBtn')?.addEventListener('click', () => window.location.href = 'search.html');
  document.getElementById('createBtn')?.addEventListener('click', () => alert('Sube un reel desde "Crear"'));
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) { localStorage.removeItem('usuario'); supabase.auth.signOut(); window.location.href = 'index.html'; }
  });
}

async function cargarReelsPexels() {
  const PEXELS_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru';
  try {
    const resp = await fetch(`https://api.pexels.com/videos/popular?per_page=10`, { headers: { 'Authorization': PEXELS_KEY } });
    const data = await resp.json();
    reelsCache = data.videos.map(v => ({
      id: v.id.toString(),
      username: v.user?.name || 'usuario',
      url: v.video_files?.find(f => f.quality === 'hd' || f.quality === 'sd')?.link || v.video_files?.[0]?.link,
      descripcion: '🎬 Video popular',
      created_at: new Date().toISOString(),
      musica: 'Sonido original'
    }));
    renderReels();
  } catch (e) {
    document.getElementById('reelsFeed').innerHTML = '<div style="text-align:center;padding:40px;color:#a8a8a8;">No hay reels disponibles</div>';
  }
}

init();
