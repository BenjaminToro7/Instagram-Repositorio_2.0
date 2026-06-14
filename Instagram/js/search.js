const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const PEXELS_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru';

function getCurrentUser() {
  return localStorage.getItem('usuario');
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil';
  return n.toString();
}

async function cargarExplore() {
  const grid = document.getElementById('resultados');
  grid.innerHTML = '';

  // Load posts from DB for explore
  const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  let items = [];

  if (posts && posts.length >= 6) {
    items = posts.map(p => {
      const media = typeof p.media === 'string' ? JSON.parse(p.media) : (p.media || []);
      const first = media[0];
      return {
        type: first?.tipo || 'imagen',
        src: first?.url || first || '',
        id: p.id,
        username: p.username,
        isPost: true
      };
    });
    renderExploreGrid(items);
  } else {
    // Fallback to Pexels
    try {
      const [fotosResp, videosResp] = await Promise.all([
        fetch('https://api.pexels.com/v1/curated?per_page=12', { headers: { 'Authorization': PEXELS_KEY } }),
        fetch('https://api.pexels.com/videos/popular?per_page=6', { headers: { 'Authorization': PEXELS_KEY } })
      ]);
      const fotos = await fotosResp.json();
      const videos = await videosResp.json();

      items = fotos.photos.map(f => ({ type: 'imagen', src: f.src.medium, id: f.id.toString(), username: f.photographer }));
      const vids = videos.videos.map(v => {
        const vf = v.video_files?.find(f => f.quality === 'hd' || f.quality === 'sd') || v.video_files?.[0];
        return { type: 'video', src: vf?.link || '', id: v.id.toString(), username: v.user?.name || 'usuario' };
      });
      items = [...items, ...vids].sort(() => 0.5 - Math.random());
      renderExploreGrid(items);
    } catch (e) {
      grid.innerHTML = '<div class="empty-msg">Error al cargar explorar</div>';
    }
  }
}

function renderExploreGrid(items) {
  const grid = document.getElementById('resultados');
  grid.innerHTML = items.map(item => {
    const mediaTag = item.type === 'video'
      ? `<video src="${item.src}" muted loop preload="metadata"></video>`
      : `<img src="${item.src}" alt="">`;
    return `
      <div class="explore-item" data-id="${item.id}" data-type="${item.type}" data-src="${item.src}">
        ${mediaTag}
        <div class="explore-overlay">
          <span><i class="fa-solid fa-heart"></i> 0</span>
          <span><i class="fa-solid fa-comment"></i> 0</span>
        </div>
      </div>
    `;
  }).join('');

  // Hover video play
  grid.querySelectorAll('.explore-item video').forEach(v => {
    v.addEventListener('mouseenter', () => v.play().catch(() => {}));
    v.addEventListener('mouseleave', () => v.pause());
  });

  // Click to open post modal
  grid.querySelectorAll('.explore-item').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.id;
      // Try to find in DB posts
      const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
      if (post) {
        abrirModalPublicacion(post.id, post.username);
      } else {
        // Just show placeholder
        alert(`Publicación de @${el.dataset.username || 'usuario'}`);
      }
    });
  });
}

// Create search input at top of explore page
document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }

  // Set nav avatar
  const navAvatar = document.getElementById('navAvatar');
  const { data: me } = await supabase.from('usuarios').select('foto').eq('username', user).maybeSingle();
  if (navAvatar && me?.foto) navAvatar.src = me.foto;

  // Add search bar
  const container = document.querySelector('.main-content > div');
  const searchBar = document.createElement('div');
  searchBar.style.cssText = 'display:flex;align-items:center;background:#262626;border-radius:8px;padding:8px 16px;gap:8px;margin-bottom:20px;';
  searchBar.innerHTML = `
    <i class="fa-solid fa-magnifying-glass" style="color:#a8a8a8;font-size:16px;"></i>
    <input type="text" id="searchExplore" placeholder="Buscar usuarios..." style="flex:1;background:none;border:none;color:#fff;font-size:14px;outline:none;">
  `;
  container.prepend(searchBar);

  document.getElementById('searchExplore').addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    if (!q) { cargarExplore(); return; }
    const { data: users } = await supabase.from('usuarios').select('username,foto,estado').ilike('username', `%${q}%`).limit(10);
    const grid = document.getElementById('resultados');
    if (!users || users.length === 0) {
      grid.innerHTML = '<div class="empty-msg">No se encontraron usuarios</div>';
      return;
    }
    grid.innerHTML = users.map(u => `
      <div class="search-user-card" data-username="${u.username}" style="cursor:pointer;display:flex;align-items:center;gap:12px;padding:8px 16px;border-radius:8px;">
        <img src="${u.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
        <div class="user-info">
          <h4 style="font-size:14px;font-weight:600;">${u.username}</h4>
          <p style="font-size:12px;color:#a8a8a8;">${u.estado || 'Usuario de Instagram'}</p>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('[data-username]').forEach(el => {
      el.addEventListener('click', () => window.location.href = `profile.html?user=${el.dataset.username}`);
    });
  });

  await cargarExplore();

  document.getElementById('searchBtn')?.addEventListener('click', () => {
    document.getElementById('searchExplore')?.focus();
  });
  document.getElementById('createBtn')?.addEventListener('click', () => alert('Crear publicación'));
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) { localStorage.removeItem('usuario'); supabase.auth.signOut(); window.location.href = 'index.html'; }
  });
});

async function abrirModalPublicacion(postId, autor) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (!post) return;
  const autorData = await supabase.from('usuarios').select('foto').eq('username', post.username).maybeSingle();
  const user = getCurrentUser();
  const { count: likesCount } = await supabase.from('likes_publicaciones').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  const { data: comments } = await supabase.from('comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
  const media = typeof post.media === 'string' ? JSON.parse(post.media) : (post.media || []);
  const modal = document.getElementById('postModal');
  document.getElementById('postModalMedia').innerHTML = media.length > 0 ? (media[0]?.tipo === 'video' ? `<video src="${media[0]?.url || media[0]}" controls style="max-width:100%;max-height:80vh;"></video>` : `<img src="${media[0]?.url || media[0]}" style="max-width:100%;max-height:80vh;object-fit:contain;">`) : '';
  document.getElementById('postModalAvatar').src = autorData?.data?.foto || 'https://i.pravatar.cc/150';
  document.getElementById('postModalUsername').textContent = post.username;
  document.getElementById('postModalCaptionUser').textContent = post.username;
  document.getElementById('postModalCaptionText').textContent = post.descripcion || '';
  document.getElementById('postModalLikes').textContent = `${formatNum(likesCount || 0)} ${likesCount === 1 ? 'like' : 'likes'}`;
  document.getElementById('postModalTime').textContent = timeAgo(post.created_at);
  document.getElementById('postModalCommentsList').innerHTML = (comments || []).map(c => `<div style="font-size:14px;"><strong>${c.username}</strong> ${c.texto}</div>`).join('');
  const likeBtn = document.getElementById('postModalLikeBtn');
  const { data: liked } = await supabase.from('likes_publicaciones').select('id').eq('post_id', postId).eq('usuario', user).maybeSingle();
  likeBtn.innerHTML = `<i class="fa-${liked ? 'solid' : 'regular'} fa-heart" style="font-size:24px;color:${liked ? '#ed4956' : '#fff'};"></i>`;
  modal.classList.add('show');

  likeBtn.onclick = async () => {
    const icon = likeBtn.querySelector('i');
    const isLiked = icon.classList.contains('fa-solid');
    if (!isLiked) {
      await supabase.from('likes_publicaciones').insert({ post_id: postId, usuario: user, autor_post: post.username });
      icon.className = 'fa-solid fa-heart'; icon.style.color = '#ed4956';
    } else {
      await supabase.from('likes_publicaciones').delete().eq('post_id', postId).eq('usuario', user);
      icon.className = 'fa-regular fa-heart'; icon.style.color = '#fff';
    }
    const { count } = await supabase.from('likes_publicaciones').select('*', { count: 'exact', head: true }).eq('post_id', postId);
    document.getElementById('postModalLikes').textContent = `${formatNum(count)} ${count === 1 ? 'like' : 'likes'}`;
  };

  document.getElementById('postModalCommentBtn').onclick = async () => {
    const input = document.getElementById('postModalCommentInput');
    const text = input.value.trim();
    if (!text) return;
    await supabase.from('comentarios').insert([{ post_id: postId, username: user, texto: text, created_at: new Date() }]);
    input.value = '';
    const { data: cmts } = await supabase.from('comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    document.getElementById('postModalCommentsList').innerHTML = (cmts || []).map(c => `<div style="font-size:14px;"><strong>${c.username}</strong> ${c.texto}</div>`).join('');
  };

  document.getElementById('closePostModalBtn').onclick = () => modal.classList.remove('show');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
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
