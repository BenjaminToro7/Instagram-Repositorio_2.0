const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = getCurrentUser();
let profileUser = null;
let profileData = null;
let isOwnProfile = false;

function getCurrentUser() {
  return localStorage.getItem('usuario');
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil';
  return n.toString();
}

async function cargarPerfil() {
  const params = new URLSearchParams(window.location.search);
  profileUser = params.get('user') || currentUser;
  isOwnProfile = profileUser === currentUser;

  const { data } = await supabase.from('usuarios').select('*').eq('username', profileUser).maybeSingle();
  if (!data) { document.getElementById('profileUsername').textContent = 'Usuario no encontrado'; return; }
  profileData = data;

  document.getElementById('profileUsername').textContent = data.username;
  document.getElementById('profileName').textContent = data.nombre || data.username;
  document.getElementById('profileAvatar').src = data.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);
  document.getElementById('profileBio').textContent = data.estado || '';

  // Verified badge
  const verBadge = document.getElementById('profileVerified');
  if (data.verificado) verBadge.style.display = 'inline'; else verBadge.style.display = 'none';

  // Stats
  const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('username', profileUser);
  const { count: followersCount } = await supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido', profileUser).eq('estado', 'aprobado');
  const { count: followingCount } = await supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguidor', profileUser).eq('estado', 'aprobado');
  document.getElementById('postsCount').textContent = formatNum(postsCount || 0);
  document.getElementById('followersCount').textContent = formatNum(followersCount || 0);
  document.getElementById('followingCount').textContent = formatNum(followingCount || 0);

  // Buttons
  const btns = document.getElementById('profileButtons');
  if (isOwnProfile) {
    btns.innerHTML = `<button class="edit-btn" id="editProfileBtn">Editar perfil</button><button class="archive-btn">Ver archivo</button>`;
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
      const newBio = prompt('Biografía:', profileData.estado || '');
      if (newBio !== null) {
        supabase.from('usuarios').update({ estado: newBio }).eq('username', currentUser);
        document.getElementById('profileBio').textContent = newBio;
      }
    });
  } else {
    const { data: followData } = await supabase.from('seguidores').select('id').eq('seguidor', currentUser).eq('seguido', profileUser).eq('estado', 'aprobado').maybeSingle();
    const isFollowing = !!followData;
    btns.innerHTML = `
      <button class="${isFollowing ? '' : 'primary-btn'}" id="followProfileBtn">${isFollowing ? 'Siguiendo' : 'Seguir'}</button>
      <button id="msgProfileBtn">Mensaje</button>
    `;
    document.getElementById('followProfileBtn').addEventListener('click', async () => {
      const btn = document.getElementById('followProfileBtn');
      if (btn.textContent === 'Siguiendo') {
        await supabase.from('seguidores').delete().eq('seguidor', currentUser).eq('seguido', profileUser);
        btn.textContent = 'Seguir'; btn.classList.remove('primary-btn');
      } else {
        await supabase.from('seguidores').insert({ seguidor: currentUser, seguido: profileUser, estado: 'aprobado' });
        btn.textContent = 'Siguiendo'; btn.classList.add('primary-btn');
      }
      const { count } = await supabase.from('seguidores').select('*', { count: 'exact', head: true }).eq('seguido', profileUser).eq('estado', 'aprobado');
      document.getElementById('followersCount').textContent = formatNum(count || 0);
    });
    document.getElementById('msgProfileBtn').addEventListener('click', () => {
      window.location.href = `messages.html?user=${profileUser}`;
    });
  }

  // Avatar click to change (own profile)
  document.getElementById('editAvatarBtn')?.addEventListener('click', () => {
    if (!isOwnProfile) return;
    const url = prompt('URL de la nueva foto de perfil:');
    if (url) {
      supabase.from('usuarios').update({ foto: url }).eq('username', currentUser);
      document.getElementById('profileAvatar').src = url;
    }
  });

  // Set nav avatar
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar && currentUser) {
    const { data: me } = await supabase.from('usuarios').select('foto').eq('username', currentUser).maybeSingle();
    if (me?.foto) navAvatar.src = me.foto;
  }

  // Load posts grid
  await cargarPostsGrid('posts');
}

async function cargarPostsGrid(tab) {
  const grid = document.getElementById('postsGrid');
  grid.innerHTML = '';

  if (tab === 'posts') {
    const { data: posts } = await supabase.from('posts').select('*').eq('username', profileUser).order('created_at', { ascending: false }).limit(30);
    if (!posts || posts.length === 0) {
      grid.innerHTML = `<div class="profile-empty"><i class="fa-regular fa-image"></i><h3>Sin publicaciones</h3><p>Cuando compartas fotos, aparecerán aquí.</p></div>`;
      return;
    }
    grid.innerHTML = posts.map(p => {
      const media = (typeof p.media === 'string' ? JSON.parse(p.media) : (p.media || []));
      const firstMedia = media[0];
      const isVideo = firstMedia?.tipo === 'video';
      const src = firstMedia?.url || firstMedia || '';
      return `
        <div class="post-item" data-post-id="${p.id}">
          ${isVideo ? `<video src="${src}" muted></video>` : `<img src="${src}" alt="">`}
          <div class="post-overlay">
            <span><i class="fa-solid fa-heart"></i> 0</span>
            <span><i class="fa-solid fa-comment"></i> 0</span>
          </div>
        </div>
      `;
    }).join('');

    // Load likes/comments overlay counts
    grid.querySelectorAll('.post-item').forEach(async (el) => {
      const pid = el.dataset.postId;
      const likesCount = await getLikesCount(pid);
      const commentsCount = await getCommentsCount(pid);
      const overlay = el.querySelector('.post-overlay');
      if (overlay) {
        overlay.innerHTML = `<span><i class="fa-solid fa-heart"></i> ${formatNum(likesCount)}</span><span><i class="fa-solid fa-comment"></i> ${formatNum(commentsCount)}</span>`;
      }
      el.addEventListener('click', () => {
        abrirModalPublicacion(pid, profileUser);
      });
    });
  } else if (tab === 'saved') {
    const { data: saves } = await supabase.from('guardados').select('post_id').eq('username', currentUser);
    if (!saves || saves.length === 0) {
      grid.innerHTML = `<div class="profile-empty"><i class="fa-regular fa-bookmark"></i><h3>Solo tú puedes ver lo que has guardado</h3><p>Guarda publicaciones para verlas después.</p></div>`;
      return;
    }
    const postIds = saves.map(s => s.post_id);
    const { data: posts } = await supabase.from('posts').select('*').in('id', postIds).order('created_at', { ascending: false });
    if (!posts || posts.length === 0) {
      grid.innerHTML = `<div class="profile-empty"><i class="fa-regular fa-bookmark"></i><h3>Sin guardados</h3></div>`;
      return;
    }
    grid.innerHTML = posts.map(p => {
      const media = (typeof p.media === 'string' ? JSON.parse(p.media) : (p.media || []));
      const firstMedia = media[0];
      const src = firstMedia?.url || firstMedia || '';
      return `<div class="post-item" data-post-id="${p.id}"><img src="${src}" alt=""><div class="post-overlay"><span><i class="fa-solid fa-heart"></i></span></div></div>`;
    }).join('');
    grid.querySelectorAll('.post-item').forEach(el => {
      el.addEventListener('click', () => abrirModalPublicacion(el.dataset.postId, ''));
    });
  } else if (tab === 'tagged') {
    grid.innerHTML = `<div class="profile-empty"><i class="fa-regular fa-id-badge"></i><h3>Fotos en las que apareces</h3><p>Cuando las personas te etiqueten, aparecerán aquí.</p></div>`;
  }
}

async function getLikesCount(postId) {
  const { count } = await supabase.from('likes_publicaciones').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return count || 0;
}
async function getCommentsCount(postId) {
  const { count } = await supabase.from('comentarios').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return count || 0;
}

async function abrirModalPublicacion(postId, autor) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (!post) return;
  const autorData = await supabase.from('usuarios').select('foto').eq('username', post.username).maybeSingle();
  const user = getCurrentUser();
  const likesCount = await getLikesCount(postId);
  const userLiked = await userLikedPost(postId, user);
  const comments = await getComments(postId);
  const media = typeof post.media === 'string' ? JSON.parse(post.media) : (post.media || []);
  const modal = document.getElementById('postModal');
  document.getElementById('postModalMedia').innerHTML = media.length > 0 ? (media[0]?.tipo === 'video' ? `<video src="${media[0]?.url || media[0]}" controls style="max-width:100%;max-height:80vh;"></video>` : `<img src="${media[0]?.url || media[0]}" style="max-width:100%;max-height:80vh;object-fit:contain;">`) : '';
  document.getElementById('postModalAvatar').src = autorData?.data?.foto || 'https://i.pravatar.cc/150';
  document.getElementById('postModalUsername').textContent = post.username;
  document.getElementById('postModalCaptionUser').textContent = post.username;
  document.getElementById('postModalCaptionText').textContent = post.descripcion || '';
  document.getElementById('postModalLikes').textContent = `${formatNum(likesCount)} ${likesCount === 1 ? 'like' : 'likes'}`;
  document.getElementById('postModalTime').textContent = timeAgo(post.created_at);
  document.getElementById('postModalCommentsList').innerHTML = (comments || []).map(c => `<div style="font-size:14px;"><strong>${c.username}</strong> ${c.texto}</div>`).join('');
  const likeBtn = document.getElementById('postModalLikeBtn');
  likeBtn.innerHTML = `<i class="fa-${userLiked ? 'solid' : 'regular'} fa-heart" style="font-size:24px;color:${userLiked ? '#ed4956' : '#fff'};"></i>`;
  likeBtn.dataset.postId = postId;
  likeBtn.dataset.autor = post.username;
  modal.classList.add('show');

  likeBtn.onclick = async () => {
    const icon = likeBtn.querySelector('i');
    const liked = icon.classList.contains('fa-solid');
    if (!liked) {
      await supabase.from('likes_publicaciones').insert({ post_id: postId, usuario: user, autor_post: post.username });
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

async function userLikedPost(postId, usuario) {
  const { data } = await supabase.from('likes_publicaciones').select('id').eq('post_id', postId).eq('usuario', usuario).maybeSingle();
  return !!data;
}
async function getComments(postId) {
  const { data } = await supabase.from('comentarios').select('*').eq('post_id', postId).order('created_at', { ascending: true });
  return data || [];
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarPerfil();

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      cargarPostsGrid(tabName);
    });
  });

  // Search btn
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    window.location.href = 'search.html';
  });

  // Create btn
  document.getElementById('createBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.add('show');
  });
  document.getElementById('closeCreateBtn')?.addEventListener('click', () => {
    document.getElementById('createModal').classList.remove('show');
  });
  document.getElementById('submitPostBtn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('postFileInput');
    const caption = document.getElementById('postCaption').value.trim();
    const files = fileInput.files;
    if (!files || files.length === 0) { alert('Selecciona archivos'); return; }
    const mediaItems = [];
    for (const file of files) {
      const tipo = file.type.startsWith('video/') ? 'video' : 'imagen';
      mediaItems.push({ tipo, url: URL.createObjectURL(file) });
    }
    const { error } = await supabase.from('posts').insert([{ username: currentUser, descripcion: caption, media: mediaItems, created_at: new Date() }]);
    if (error) { alert('Error: ' + error.message); return; }
    document.getElementById('createModal').classList.remove('show');
    document.getElementById('postFileInput').value = '';
    document.getElementById('postCaption').value = '';
    await cargarPostsGrid('posts');
  });

  // More
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) {
      localStorage.removeItem('usuario');
      supabase.auth.signOut();
      window.location.href = 'index.html';
    }
  });
});
