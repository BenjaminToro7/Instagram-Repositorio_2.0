// ==================== SUPABASE (renombrado para evitar conflicto) ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== ESTADO GLOBAL ====================
let currentUser = null;
let videos = [];
let currentPage = 1;
let isLoading = false;

// ==================== DOM ELEMENTOS ====================
const feedContainer = document.getElementById('reelsFeed');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authError = document.getElementById('authError');
const closeAuthBtn = document.querySelector('.close-auth');

// ==================== API DE PEXELS ====================
const PEXELS_API_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru'; // Tu clave

async function fetchVideos() {
  if (isLoading) return;
  isLoading = true;
  try {
    const response = await fetch(`https://api.pexels.com/videos/popular?min_duration=5&max_duration=90&per_page=15&page=${currentPage}`, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });
    const data = await response.json();
    videos = [...videos, ...data.videos];
    currentPage++;
    renderFeed();
  } catch (error) {
    console.error('Error al cargar videos:', error);
  } finally {
    isLoading = false;
  }
}

function renderFeed() {
  if (!feedContainer) return;
  const html = videos.map(video => {
    const videoFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || video.video_files[0];
    const videoUrl = videoFile ? videoFile.link : '';
    const liked = currentUser ? checkLikeStatusSync(video.id) : false;
    return `
      <div class="reel" data-video-id="${video.id}">
        <video src="${videoUrl}" loop muted playsinline preload="metadata"></video>
        <div class="reel-info">
          <div class="reel-user">
            <i class="fa-regular fa-user-circle"></i>
            <span>@${video.user?.name?.toLowerCase().replace(/\s/g, '') || 'usuario'}</span>
          </div>
          <div class="reel-caption">${video.url ? '🎬 ' + video.url.split('/').pop() : 'Reel de Pexels'}</div>
        </div>
        <div class="reel-actions">
          <button class="action-btn like-btn" data-id="${video.id}">
            <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
            <span>${video.likes || 0}</span>
          </button>
          <button class="action-btn comment-btn"><i class="fa-regular fa-comment"></i><span>0</span></button>
          <button class="action-btn share-btn"><i class="fa-regular fa-paper-plane"></i><span>0</span></button>
        </div>
      </div>
    `;
  }).join('');
  feedContainer.innerHTML = html;
  attachVideoObservers();
  attachLikeButtons();
}

function attachVideoObservers() {
  const videosEl = document.querySelectorAll('.reel video');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(e => console.log('autoplay falló'));
        video.muted = false;
      } else {
        video.pause();
        video.muted = true;
      }
    });
  }, { threshold: 0.6 });
  videosEl.forEach(v => observer.observe(v));
}

let likesCache = new Set();

async function loadUserLikes() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from('reels_likes')
    .select('video_id')
    .eq('user_id', currentUser.id);
  if (!error && data) {
    likesCache = new Set(data.map(row => row.video_id));
  }
}

function checkLikeStatusSync(videoId) {
  return likesCache.has(videoId);
}

async function toggleLike(videoId, buttonElement) {
  if (!currentUser) {
    authModal.style.display = 'flex';
    return;
  }
  const isLiked = likesCache.has(videoId);
  const heartIcon = buttonElement.querySelector('i');
  const likesSpan = buttonElement.querySelector('span');
  let currentLikes = parseInt(likesSpan.innerText);

  if (isLiked) {
    const { error } = await supabaseClient
      .from('reels_likes')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('video_id', videoId);
    if (!error) {
      likesCache.delete(videoId);
      heartIcon.className = 'fa-regular fa-heart';
      likesSpan.innerText = currentLikes - 1;
      buttonElement.classList.remove('liked');
    }
  } else {
    const { error } = await supabaseClient
      .from('reels_likes')
      .insert({ user_id: currentUser.id, video_id: videoId });
    if (!error) {
      likesCache.add(videoId);
      heartIcon.className = 'fa-solid fa-heart';
      likesSpan.innerText = currentLikes + 1;
      buttonElement.classList.add('liked');
    }
  }
}

function attachLikeButtons() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.removeEventListener('click', likeHandler);
    btn.addEventListener('click', likeHandler);
  });
}

async function likeHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const videoId = btn.getAttribute('data-id');
  await toggleLike(videoId, btn);
}

// Autenticación
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
      if (signUpError) {
        authError.innerText = signUpError.message;
        return;
      }
      authError.innerText = '✅ Revisa tu correo para confirmar la cuenta. Luego inicia sesión.';
    } else {
      authError.innerText = error.message;
    }
    return;
  }
  currentUser = data.user;
  await loadUserLikes();
  authModal.style.display = 'none';
  authForm.reset();
  authError.innerText = '';
  renderFeed();
});

closeAuthBtn.addEventListener('click', () => authModal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === authModal) authModal.style.display = 'none'; });

// Scroll infinito
const sentinelObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !isLoading) fetchVideos();
}, { threshold: 1.0 });

function observeEndOfFeed() {
  const sentinel = document.getElementById('scroll-sentinel');
  if (sentinel) sentinelObserver.observe(sentinel);
}

async function init() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  currentUser = user;
  if (currentUser) await loadUserLikes();
  await fetchVideos();
  feedContainer.insertAdjacentHTML('beforeend', '<div id="scroll-sentinel" style="height: 10px;"></div>');
  observeEndOfFeed();
}
init();