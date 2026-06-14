const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentUserData = null;

function getCurrentUser() {
  let user = localStorage.getItem('usuario');
  return user || null;
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil';
  return n.toString();
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff/86400)} días`;
  return d.toLocaleDateString();
}

async function getUserData(username) {
  const { data } = await supabase.from('usuarios').select('*').eq('username', username).maybeSingle();
  return data;
}

function showSkeleton() {
  const stories = document.getElementById('storiesSection');
  const feed = document.getElementById('feedSection');
  stories.innerHTML = Array(7).fill(0).map(() =>
    `<div class="skeleton-story"><div class="skeleton skeleton-circle"></div><div class="skeleton skeleton-text short"></div></div>`
  ).join('');
  feed.innerHTML = Array(3).fill(0).map(() =>
    `<div class="skeleton-post">
      <div class="skeleton-post-header">
        <div class="skeleton skeleton-circle" style="width:32px;height:32px;"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
      <div class="skeleton skeleton-rect"></div>
      <div class="skeleton-post-body">
        <div class="skeleton skeleton-text" style="width:40px;"></div>
        <div class="skeleton skeleton-text" style="width:40px;"></div>
        <div class="skeleton skeleton-text" style="width:40px;"></div>
      </div>
      <div class="skeleton skeleton-text" style="width:50%;"></div>
    </div>`
  ).join('');
}

async function cargarHistorias() {
  const container = document.getElementById('storiesSection');
  const user = getCurrentUser();
  const { data: seguidos } = await supabase.from('seguidores').select('seguido').eq('seguidor', user).eq('estado', 'aprobado');
  let usuarios = [];
  if (seguidos && seguidos.length > 0) {
    const usernames = seguidos.map(s => s.seguido);
    const { data: u } = await supabase.from('usuarios').select('username,foto').in('username', usernames).limit(15);
    if (u) usuarios = u;
  }
  container.innerHTML = usuarios.map(u =>
    `<div class="story" data-username="${u.username}">
      <div class="story-avatar"><img src="${u.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt=""></div>
      <span class="story-username">${u.username.length > 10 ? u.username.substring(0,10)+'…' : u.username}</span>
    </div>`
  ).join('') || '<div class="empty-stories">Sigue a usuarios para ver sus historias</div>';
  container.querySelectorAll('.story').forEach(el => {
    el.addEventListener('click', () => {
      const username = el.dataset.username;
      abrirVisorHistorias(username, usuarios);
    });
  });
}

let storiesViewerActive = false;
let storiesViewerTimeout = null;
let currentStoryIndex = 0;
let currentStoryMediaIndex = 0;
let storiesData = [];

async function abrirVisorHistorias(startUsername, usuariosList) {
  storiesData = [];
  for (const u of usuariosList) {
    const { data: stories } = await supabase.from('historias').select('*').eq('username', u.username).gte('created_at', new Date(Date.now() - 86400000).toISOString()).order('created_at', { ascending: false });
    if (stories && stories.length > 0) {
      storiesData.push({ user: u, stories });
    }
  }
  if (storiesData.length === 0) return;
  const startIdx = storiesData.findIndex(s => s.user.username === startUsername);
  if (startIdx === -1) return;
  currentStoryIndex = startIdx;
  currentStoryMediaIndex = 0;
  renderStoriesViewer();
}

function renderStoriesViewer() {
  const existing = document.querySelector('.stories-viewer');
  if (existing) existing.remove();
  if (currentStoryIndex >= storiesData.length) { document.querySelector('.stories-viewer')?.remove(); return; }
  const group = storiesData[currentStoryIndex];
  if (currentStoryMediaIndex >= group.stories.length) { currentStoryIndex++; currentStoryMediaIndex = 0; renderStoriesViewer(); return; }
  const story = group.stories[currentStoryMediaIndex];

  const viewer = document.createElement('div');
  viewer.className = 'stories-viewer';

  const totalSegments = group.stories.length;
  let progressHTML = group.stories.map((s, i) =>
    `<div class="progress-segment ${i < currentStoryMediaIndex ? 'seen' : i === currentStoryMediaIndex ? 'active' : ''}"><div class="progress-fill" style="${i === currentStoryMediaIndex ? 'width:0%' : ''}"></div></div>`
  ).join('');

  viewer.innerHTML = `
    <div class="stories-viewer-content">
      <button class="stories-viewer-close">&times;</button>
      <div class="stories-progress-bar">${progressHTML}</div>
      <div class="stories-viewer-header">
        <img src="${group.user.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="">
        <span>${group.user.username}</span>
        <span class="stories-time">${timeAgo(story.created_at)}</span>
        <div class="story-view-actions" style="margin-left:auto;">
          <i class="fa-regular fa-eye" title="Ver quién vio" style="font-size:16px;cursor:pointer;"></i>
          <i class="fa-solid fa-trash" title="Eliminar historia" style="font-size:16px;cursor:pointer;display:${group.user.username === getCurrentUser() ? 'inline-block' : 'none'};"></i>
        </div>
      </div>
      <div class="stories-viewer-body" id="svBody">
        ${story.tipo === 'video' ? `<video src="${story.url}" autoplay muted playsinline></video>` : `<img src="${story.url}" alt="">`}
      </div>
      <div class="stories-viewer-footer">
        <input type="text" placeholder="Enviar mensaje..." id="svReplyInput">
        <button id="svSendReply">Enviar</button>
      </div>
    </div>
  `;

  document.body.appendChild(viewer);
  storiesViewerActive = true;
  startStoryProgress(group.stories[currentStoryMediaIndex]);

  viewer.querySelector('.stories-viewer-close').onclick = () => { viewer.remove(); storiesViewerActive = false; clearTimeout(storiesViewerTimeout); };
  viewer.querySelector('.stories-viewer-body').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      // tap left: go to previous
      if (currentStoryMediaIndex > 0) { currentStoryMediaIndex--; renderStoriesViewer(); }
      else if (currentStoryIndex > 0) { currentStoryIndex--; currentStoryMediaIndex = storiesData[currentStoryIndex].stories.length - 1; renderStoriesViewer(); }
    } else {
      // tap right: next
      if (currentStoryMediaIndex < group.stories.length - 1) { currentStoryMediaIndex++; renderStoriesViewer(); }
      else if (currentStoryIndex < storiesData.length - 1) { currentStoryIndex++; currentStoryMediaIndex = 0; renderStoriesViewer(); }
      else { viewer.remove(); storiesViewerActive = false; }
    }
  };

  // Send reply
  viewer.querySelector('#svSendReply').onclick = async () => {
    const input = viewer.querySelector('#svReplyInput');
    const text = input.value.trim();
    if (!text) return;
    await supabase.from('mensajes').insert([{ emisor: getCurrentUser(), receptor: group.user.username, mensaje: text, fecha: new Date() }]);
    input.value = '';
  };

  // Delete story
  viewer.querySelector('.fa-trash')?.addEventListener('click', async () => {
    if (confirm('Eliminar esta historia?')) {
      await supabase.from('historias').delete().eq('id', story.id);
      group.stories.splice(currentStoryMediaIndex, 1);
      if (group.stories.length === 0) {
        storiesData.splice(currentStoryIndex, 1);
        currentStoryMediaIndex = 0;
      }
      renderStoriesViewer();
    }
  });

  // Viewers
  viewer.querySelector('.fa-eye')?.addEventListener('click', async () => {
    const { data: views } = await supabase.from('historia_vistas').select('*').eq('historia_id', story.id);
    const viewerNames = views ? views.map(v => v.username).join(', ') : 'Nadie';
    alert(`Visto por: ${viewerNames || 'Nadie aún'}`);
  });
}

function startStoryProgress(story) {
  clearTimeout(storiesViewerTimeout);
  const fill = document.querySelector('.progress-segment.active .progress-fill');
  if (!fill) return;
  const duration = story.tipo === 'video' ? 15000 : 5000;
  const startTime = Date.now();
  function update() {
    const elapsed = Date.now() - startTime;
    const pct = Math.min(100, (elapsed / duration) * 100);
    fill.style.width = pct + '%';
    if (pct < 100) { storiesViewerTimeout = setTimeout(update, 50); }
    else {
      const group = storiesData[currentStoryIndex];
      if (currentStoryMediaIndex < group.stories.length - 1) { currentStoryMediaIndex++; renderStoriesViewer(); }
      else if (currentStoryIndex < storiesData.length - 1) { currentStoryIndex++; currentStoryMediaIndex = 0; renderStoriesViewer(); }
      else { document.querySelector('.stories-viewer')?.remove(); storiesViewerActive = false; }
    }
  }
  update();
}

async function cargarFeed() {
  const container = document.getElementById('feedSection');
  const user = getCurrentUser();
  showSkeleton();
  const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);
  if (!posts || posts.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#a8a8a8;font-size:14px;">No hay publicaciones. ¡Sigue a usuarios o crea tu primera publicación!</div>';
    return;
  }
  let html = '';
  for (const post of posts) {
    const autor = await getUserData(post.username);
    const isFollowing = await checkFollowing(user, post.username);
    const likesCount = await getLikesCount(post.id);
    const userLiked = await userLikedPost(post.id, user);
    const comments = await getComments(post.id);

    const media = post.media || [];
    const mediaArr = typeof media === 'string' ? JSON.parse(media) : media;
    const isCarousel = mediaArr.length > 1;

    html += `
      <div class="post" data-post-id="${post.id}" data-autor="${post.username}">
        <div class="post-header">
          <div class="post-user" data-username="${post.username}">
            <img src="${autor?.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="" class="post-avatar">
            <span class="post-username">${post.username}</span>
            ${post.username !== user ? `<button class="follow-btn ${isFollowing ? 'following' : ''}">${isFollowing ? 'Siguiendo' : 'Seguir'}</button>` : ''}
          </div>
          <button class="post-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
        </div>
        <div class="post-image ${isCarousel ? 'post-carousel' : ''}" data-idx="0">
          ${isCarousel ? renderCarousel(mediaArr, post.id) : renderMedia(mediaArr[0])}
          <div class="post-heart-overlay"><i class="fa-solid fa-heart"></i></div>
        </div>
        <div class="post-body">
          <div class="post-actions">
            <div class="post-actions-left">
              <button class="action-btn like-btn ${userLiked ? 'liked' : ''}"><i class="fa-${userLiked ? 'solid' : 'regular'} fa-heart"></i></button>
              <button class="action-btn comment-btn"><i class="fa-regular fa-comment"></i></button>
              <button class="action-btn share-btn"><i class="fa-regular fa-paper-plane"></i></button>
            </div>
            <button class="action-btn save-btn"><i class="fa-regular fa-bookmark"></i></button>
          </div>
          <div class="post-likes">${formatNum(likesCount)} ${likesCount === 1 ? 'like' : 'likes'}</div>
          <div class="post-caption">
            <span class="post-username">${post.username}</span>
            ${post.descripcion || ''}
          </div>
          ${comments && comments.length > 0 ? `<div class="post-comments">${comments.slice(0, 3).map(c => `<div class="post-comment"><span class="post-username">${c.username}</span> ${c.texto}</div>`).join('')}</div>` : ''}
          <div class="post-comments-link">${comments && comments.length > 3 ? `Ver los ${comments.length} comentarios` : comments && comments.length > 0 ? 'Ver comentarios' : ''}</div>
          <div class="post-time">${timeAgo(post.created_at)}</div>
          <div class="post-add-comment">
            <input type="text" placeholder="Agrega un comentario..." class="comment-input">
            <button class="post-btn">Publicar</button>
          </div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
  asignarEventosFeed();
  attachCarouselControls();
}

function renderMedia(mediaItem) {
  if (!mediaItem) return '';
  if (mediaItem.tipo === 'video') return `<video src="${mediaItem.url}" loop muted playsinline preload="metadata"></video>`;
  return `<img src="${mediaItem.url || mediaItem}" alt="">`;
}

function renderCarousel(items, postId) {
  return `
    <div class="carousel-inner" data-post="${postId}">
      ${items.map((item, i) => `<div class="carousel-slide" data-index="${i}" style="${i !== 0 ? 'display:none' : ''}">${renderMedia(item)}</div>`).join('')}
      <button class="carousel-btn carousel-prev"><i class="fa-solid fa-chevron-left"></i></button>
      <button class="carousel-btn carousel-next"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="carousel-dots">${items.map((_, i) => `<div class="carousel-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>
    </div>
  `;
}

function attachCarouselControls() {
  document.querySelectorAll('.carousel-inner').forEach(inner => {
    const slides = inner.querySelectorAll('.carousel-slide');
    const dots = inner.querySelectorAll('.carousel-dot');
    const prev = inner.querySelector('.carousel-prev');
    const next = inner.querySelector('.carousel-next');
    let idx = 0;
    function show(i) {
      slides.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none');
      dots.forEach((d, j) => d.classList.toggle('active', j === i));
    }
    prev?.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx - 1 + slides.length) % slides.length; show(idx); });
    next?.addEventListener('click', (e) => { e.stopPropagation(); idx = (idx + 1) % slides.length; show(idx); });
  });
}

async function checkFollowing(follower, followed) {
  if (follower === followed) return false;
  const { data } = await supabase.from('seguidores').select('id').eq('seguidor', follower).eq('seguido', followed).eq('estado', 'aprobado').maybeSingle();
  return !!data;
}

async function getLikesCount(postId) {
  const { count } = await supabase.from('likes_publicaciones').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return count || 0;
}

async function userLikedPost(postId, usuario) {
  const { data } = await supabase.from('likes_publicaciones').select('id').eq('post_id', postId).eq('usuario', usuario).maybeSingle();
  return !!data;
}

async function getComments(postId) {
  const { data } = await supabase.from('comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
  return data || [];
}

function asignarEventosFeed() {
  const user = getCurrentUser();
  document.querySelectorAll('.post video').forEach(v => {
    v.addEventListener('mouseenter', () => v.play().catch(() => {}));
    v.addEventListener('mouseleave', () => v.pause());
  });
  document.querySelectorAll('.follow-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const post = btn.closest('.post');
      const autor = post.dataset.autor;
      const sigue = btn.classList.contains('following');
      if (sigue) {
        await supabase.from('seguidores').delete().eq('seguidor', user).eq('seguido', autor);
        btn.textContent = 'Seguir'; btn.classList.remove('following');
      } else {
        await supabase.from('seguidores').insert({ seguidor: user, seguido: autor, estado: 'aprobado' });
        btn.textContent = 'Siguiendo'; btn.classList.add('following');
      }
    });
  });
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const post = btn.closest('.post');
      const postId = post.dataset.postId;
      const autor = post.dataset.autor;
      const icon = btn.querySelector('i');
      const likesSpan = post.querySelector('.post-likes');
      const liked = icon.classList.contains('fa-solid');
      if (!liked) {
        await supabase.from('likes_publicaciones').insert({ post_id: postId, usuario: user, autor_post: autor });
        icon.className = 'fa-solid fa-heart'; btn.classList.add('liked');
        const overlay = post.querySelector('.post-heart-overlay');
        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 500);
      } else {
        await supabase.from('likes_publicaciones').delete().eq('post_id', postId).eq('usuario', user);
        icon.className = 'fa-regular fa-heart'; btn.classList.remove('liked');
      }
      const count = await getLikesCount(postId);
      likesSpan.textContent = `${formatNum(count)} ${count === 1 ? 'like' : 'likes'}`;
    });
  });
  document.querySelectorAll('.post-image').forEach(imgDiv => {
    imgDiv.addEventListener('dblclick', async (e) => {
      e.stopPropagation();
      const likeBtn = imgDiv.closest('.post')?.querySelector('.like-btn');
      if (likeBtn && !likeBtn.querySelector('i').classList.contains('fa-solid')) likeBtn.click();
    });
  });
  document.querySelectorAll('.post-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const post = btn.closest('.post');
      const input = post.querySelector('.comment-input');
      const text = input.value.trim();
      if (!text) return;
      const postId = post.dataset.postId;
      await supabase.from('comentarios').insert([{ post_id: postId, username: user, texto: text, created_at: new Date() }]);
      input.value = '';
      const comments = await getComments(postId);
      const container = post.querySelector('.post-comments');
      container.innerHTML = comments.slice(-3).map(c => `<div class="post-comment"><span class="post-username">${c.username}</span> ${c.texto}</div>`).join('');
      post.querySelector('.post-comments-link').textContent = comments.length > 3 ? `Ver los ${comments.length} comentarios` : comments.length > 0 ? 'Ver comentarios' : '';
    });
  });
  document.querySelectorAll('.post-user').forEach(el => {
    el.addEventListener('click', () => window.location.href = `profile.html?user=${el.dataset.username}`);
  });
  document.querySelectorAll('.post-image').forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.target.closest('.carousel-btn')) return;
      const post = this.closest('.post');
      const postId = post.dataset.postId;
      const autor = post.dataset.autor;
      abrirModalPublicacion(postId, autor);
    });
  });
}

async function abrirModalPublicacion(postId, autor) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (!post) return;
  const user = getCurrentUser();
  const autorData = await getUserData(autor);
  const likesCount = await getLikesCount(postId);
  const userLiked = await userLikedPost(postId, user);
  const comments = await getComments(postId);
  const media = typeof post.media === 'string' ? JSON.parse(post.media) : (post.media || []);
  const modal = document.getElementById('postModal');
  const mediaEl = document.getElementById('postModalMedia');
  mediaEl.innerHTML = media.length > 0 ? renderMedia(media[0]) : '';
  document.getElementById('postModalAvatar').src = autorData?.foto || 'https://i.pravatar.cc/150';
  document.getElementById('postModalUsername').textContent = autor;
  document.getElementById('postModalCaptionUser').textContent = autor;
  document.getElementById('postModalCaptionText').textContent = post.descripcion || '';
  document.getElementById('postModalLikes').textContent = `${formatNum(likesCount)} ${likesCount === 1 ? 'like' : 'likes'}`;
  document.getElementById('postModalTime').textContent = timeAgo(post.created_at);
  const commentsList = document.getElementById('postModalCommentsList');
  commentsList.innerHTML = (comments || []).map(c => `<div style="font-size:14px;"><strong>${c.username}</strong> ${c.texto}</div>`).join('');
  const likeBtn = document.getElementById('postModalLikeBtn');
  likeBtn.innerHTML = `<i class="fa-${userLiked ? 'solid' : 'regular'} fa-heart" style="font-size:24px;color:${userLiked ? '#ed4956' : '#fff'};"></i>`;
  likeBtn.dataset.postId = postId;
  likeBtn.dataset.autor = autor;
  modal.classList.add('show');

  likeBtn.onclick = async () => {
    const icon = likeBtn.querySelector('i');
    const liked = icon.classList.contains('fa-solid');
    if (!liked) {
      await supabase.from('likes_publicaciones').insert({ post_id: postId, usuario: user, autor_post: autor });
      icon.className = 'fa-solid fa-heart'; icon.style.color = '#ed4956';
    } else {
      await supabase.from('likes_publicaciones').delete().eq('post_id', postId).eq('usuario', user);
      icon.className = 'fa-regular fa-heart'; icon.style.color = '#fff';
    }
    const c = await getLikesCount(postId);
    document.getElementById('postModalLikes').textContent = `${formatNum(c)} ${c === 1 ? 'like' : 'likes'}`;
  };

  document.getElementById('postModalCommentBtn').onclick = async () => {
    const input = document.getElementById('postModalCommentInput');
    const text = input.value.trim();
    if (!text) return;
    await supabase.from('comentarios').insert([{ post_id: postId, username: user, texto: text, created_at: new Date() }]);
    input.value = '';
    const cmts = await getComments(postId);
    document.getElementById('postModalCommentsList').innerHTML = cmts.map(c => `<div style="font-size:14px;"><strong>${c.username}</strong> ${c.texto}</div>`).join('');
  };

  document.getElementById('closePostModalBtn').onclick = () => modal.classList.remove('show');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
}

async function init() {
  currentUser = getCurrentUser();
  if (!currentUser) { window.location.href = 'index.html'; return; }
  currentUserData = await getUserData(currentUser);
  // Set nav avatar
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar && currentUserData?.foto) navAvatar.src = currentUserData.foto;

  await cargarHistorias();
  await cargarFeed();

  // Search button
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    document.getElementById('searchPanel').classList.add('show');
    loadSearchPanel();
  });
  document.getElementById('searchPanel')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
  });

  // Create button
  document.getElementById('createBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.add('show');
  });
  document.getElementById('closeCreateBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('show');
  });

  // Submit post
  document.getElementById('submitPostBtn')?.addEventListener('click', submitPost);

  // More button
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) {
      localStorage.removeItem('usuario');
      supabase.auth.signOut();
      window.location.href = 'index.html';
    }
  });

  // Real-time refresh every 30s
  setInterval(() => { cargarFeed(); cargarHistorias(); }, 30000);
}

function loadSearchPanel() {
  const input = document.getElementById('searchInputPanel');
  const recentDiv = document.getElementById('recentList');
  const suggestedDiv = document.getElementById('suggestedList');

  // Load recent searches from localStorage
  const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  recentDiv.innerHTML = recent.slice(0, 5).map(u =>
    `<div class="search-user-card" data-username="${u}">
      <img src="https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}" alt="">
      <div class="user-info"><h4>${u}</h4><p>Búsqueda reciente</p></div>
    </div>`
  ).join('') || '<p style="color:#a8a8a8;font-size:13px;">Sin búsquedas recientes</p>';

  // Load suggested users (not followed)
  (async () => {
    const user = getCurrentUser();
    const { data: seguidos } = await supabase.from('seguidores').select('seguido').eq('seguidor', user);
    const exclude = [user, ...(seguidos || []).map(s => s.seguido)];
    const { data: sug } = await supabase.from('usuarios').select('username,foto,estado').not('username', 'in', `(${exclude.join(',')})`).limit(5);
    suggestedDiv.innerHTML = (sug || []).map(u =>
      `<div class="search-user-card" data-username="${u.username}">
        <img src="${u.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="">
        <div class="user-info"><h4>${u.username}</h4><p>${u.estado || 'Usuario de Instagram'}</p></div>
      </div>`
    ).join('') || '<p style="color:#a8a8a8;font-size:13px;">No hay sugerencias</p>';

    suggestedDiv.querySelectorAll('.search-user-card').forEach(el => {
      el.addEventListener('click', () => window.location.href = `profile.html?user=${el.dataset.username}`);
    });
    recentDiv.querySelectorAll('.search-user-card').forEach(el => {
      el.addEventListener('click', () => window.location.href = `profile.html?user=${el.dataset.username}`);
    });
  })();

  input.oninput = async () => {
    const q = input.value.trim();
    if (!q) { document.getElementById('recentSearches').style.display = 'block'; suggestedDiv.style.display = 'block'; return; }
    document.getElementById('recentSearches').style.display = 'none';
    suggestedDiv.style.display = 'none';
    // Save to recent
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (!recent.includes(q)) { recent.unshift(q); localStorage.setItem('recentSearches', JSON.stringify(recent.slice(0, 10))); }
    const { data: users } = await supabase.from('usuarios').select('username,foto,estado').ilike('username', `%${q}%`).limit(10);
    suggestedDiv.innerHTML = (users || []).map(u =>
      `<div class="search-user-card" data-username="${u.username}">
        <img src="${u.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="">
        <div class="user-info"><h4>${u.username}</h4><p>${u.estado || 'Usuario de Instagram'}</p></div>
      </div>`
    ).join('') || '<p style="color:#a8a8a8;font-size:13px;padding:16px;">No se encontraron usuarios</p>';
    suggestedDiv.style.display = 'block';
    suggestedDiv.querySelectorAll('.search-user-card').forEach(el => {
      el.addEventListener('click', () => window.location.href = `profile.html?user=${el.dataset.username}`);
    });
  };
}

async function submitPost() {
  const fileInput = document.getElementById('postFileInput');
  const caption = document.getElementById('postCaption').value.trim();
  const location = document.getElementById('postLocation').value.trim();
  const files = fileInput.files;
  if (!files || files.length === 0) { alert('Selecciona al menos una imagen o video'); return; }

  // Upload files to a free image hosting via base64 or use placeholder URLs
  // Since we can't use a real file upload service, we'll use placeholder URLs based on file type
  // In production, you'd upload to a CDN (Supabase Storage, Cloudinary, etc.)
  const mediaItems = [];
  for (const file of files) {
    const tipo = file.type.startsWith('video/') ? 'video' : 'imagen';
    // Create object URL as temporary placeholder (works in current session)
    const url = URL.createObjectURL(file);
    mediaItems.push({ tipo, url });
  }

  const { error } = await supabase.from('posts').insert([{
    username: getCurrentUser(),
    descripcion: caption,
    ubicacion: location || null,
    media: mediaItems,
    created_at: new Date()
  }]);

  if (error) { alert('Error al publicar: ' + error.message); return; }
  document.getElementById('createModal').classList.remove('show');
  document.getElementById('postFileInput').value = '';
  document.getElementById('postCaption').value = '';
  document.getElementById('postLocation').value = '';
  document.getElementById('postPreview').innerHTML = '';
  await cargarFeed();
}

init();
