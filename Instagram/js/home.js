// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== PEXELS ====================
const PEXELS_API_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru';

// ==================== DOM ====================
const storiesContainer = document.getElementById('storiesSection');
const feedContainer = document.getElementById('feedSection');

let usuarioActual = null;

// ==================== USUARIO ACTUAL (localStorage) ====================
function getUsuarioActual() {
    let user = localStorage.getItem("usuario");
    if (!user) {
        user = "juan";
        localStorage.setItem("usuario", user);
    }
    return user;
}

// ==================== ASEGURAR USUARIO ACTUAL EN SUPABASE ====================
async function asegurarUsuarioActual() {
    const username = getUsuarioActual();
    const { data, error } = await supabase
        .from('usuarios')
        .select('username')
        .eq('username', username)
        .single();
    if (!data) {
        await supabase
            .from('usuarios')
            .insert([{
                username: username,
                email: `${username}@example.com`,
                foto: 'https://i.pravatar.cc/150?img=10',
                estado: 'Hola, uso Instagram'
            }]);
    }
    return username;
}

// ==================== CARGAR HISTORIAS (SOLO DE USUARIOS QUE SIGO) ====================
async function cargarHistorias() {
    const currentUser = getUsuarioActual();
    // Obtener lista de usuarios que sigo
    const { data: seguidos, error } = await supabase
        .from('seguidores')
        .select('seguido')
        .eq('seguidor', currentUser)
        .eq('estado', 'aprobado');

    if (error || !seguidos || seguidos.length === 0) {
        storiesContainer.innerHTML = '<div class="empty-stories">No hay historias</div>';
        return;
    }

    const seguidosUsernames = seguidos.map(s => s.seguido);
    // Obtener datos de esos usuarios
    const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('username, foto')
        .in('username', seguidosUsernames)
        .limit(12);

    if (userError || !usuarios || usuarios.length === 0) {
        storiesContainer.innerHTML = '<div class="empty-stories">No hay historias</div>';
        return;
    }

    storiesContainer.innerHTML = usuarios.map(usuario => `
        <div class="story" data-username="${usuario.username}">
            <div class="story-avatar">
                <img src="${usuario.foto || 'https://via.placeholder.com/66'}" alt="${usuario.username}">
            </div>
            <span class="story-username">${usuario.username.substring(0, 10)}</span>
        </div>
    `).join('');

    document.querySelectorAll('.story').forEach(story => {
        story.addEventListener('click', () => {
            const username = story.getAttribute('data-username');
            window.location.href = `profile.html?user=${username}`;
        });
    });
}

// ==================== OBTENER FOTO DE PERFIL ====================
async function getFotoPerfil(username) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('foto')
        .eq('username', username)
        .single();
    if (error || !data) {
        return `https://ui-avatars.com/api/?name=${username.charAt(0)}&background=0095f6&color=fff&size=42`;
    }
    return data.foto || `https://ui-avatars.com/api/?name=${username.charAt(0)}&background=0095f6&color=fff&size=42`;
}

// ==================== SEGUIMIENTO (con actualización de historias) ====================
async function isFollowing(seguidor, seguido) {
    const { data, error } = await supabase
        .from('seguidores')
        .select('id')
        .eq('seguidor', seguidor)
        .eq('seguido', seguido)
        .eq('estado', 'aprobado')
        .single();
    return !!data;
}

async function toggleFollow(seguidor, seguido, buttonElement) {
    const sigue = await isFollowing(seguidor, seguido);
    if (sigue) {
        await supabase
            .from('seguidores')
            .delete()
            .eq('seguidor', seguidor)
            .eq('seguido', seguido);
        buttonElement.textContent = 'Seguir';
        buttonElement.classList.remove('following');
    } else {
        await supabase
            .from('seguidores')
            .insert({ seguidor, seguido, estado: 'aprobado' });
        buttonElement.textContent = 'Siguiendo';
        buttonElement.classList.add('following');
    }
    // Recargar historias porque cambió la lista de seguidos
    await cargarHistorias();
}

// ==================== LIKES ====================
async function getLikesCount(postId) {
    const { count, error } = await supabase
        .from('likes_publicaciones')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
    return count || 0;
}

async function userLikedPost(postId, usuario) {
    const { data, error } = await supabase
        .from('likes_publicaciones')
        .select('id')
        .eq('post_id', postId)
        .eq('usuario', usuario)
        .single();
    return !!data;
}

async function likePost(postId, autor, usuario) {
    await supabase
        .from('likes_publicaciones')
        .insert({ post_id: postId, usuario, autor_post: autor });
}

async function unlikePost(postId, usuario) {
    await supabase
        .from('likes_publicaciones')
        .delete()
        .eq('post_id', postId)
        .eq('usuario', usuario);
}

// ==================== FEED (PEXELS) ====================
async function cargarFeed() {
    feedContainer.innerHTML = '<div style="text-align:center;">Cargando publicaciones...</div>';
    try {
        const [fotosResp, videosResp] = await Promise.all([
            fetch('https://api.pexels.com/v1/curated?per_page=8', { headers: { 'Authorization': PEXELS_API_KEY } }),
            fetch('https://api.pexels.com/videos/popular?per_page=4', { headers: { 'Authorization': PEXELS_API_KEY } })
        ]);
        const fotosData = await fotosResp.json();
        const videosData = await videosResp.json();

        const posts = [];
        fotosData.photos.forEach(foto => {
            posts.push({
                tipo: 'imagen',
                media: foto.src.medium,
                usuario: foto.photographer,
                caption: `📸 ${foto.alt || 'Publicación de ' + foto.photographer}`
            });
        });
        videosData.videos.forEach(video => {
            const videoFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || video.video_files[0];
            posts.push({
                tipo: 'video',
                media: videoFile.link,
                usuario: video.user.name,
                caption: `🎬 ${video.user.name}`
            });
        });
        const shuffled = posts.sort(() => 0.5 - Math.random());
        await renderFeed(shuffled);
    } catch (error) {
        console.error(error);
        feedContainer.innerHTML = '<div style="text-align:center;">Error al cargar el feed</div>';
    }
}

async function renderFeed(posts) {
    feedContainer.innerHTML = '';
    const currentUser = getUsuarioActual();

    for (let idx = 0; idx < posts.length; idx++) {
        const post = posts[idx];
        const postId = `post_${Date.now()}_${idx}`;
        const fotoAutor = await getFotoPerfil(post.usuario);
        const likesCount = await getLikesCount(postId);
        const userLiked = await userLikedPost(postId, currentUser);
        // Verificar si el autor existe en Supabase (para mostrar botón seguir)
        const { data: autorExiste } = await supabase
            .from('usuarios')
            .select('username')
            .eq('username', post.usuario)
            .single();
        const mostrarBotonSeguir = !!autorExiste && post.usuario !== currentUser;
        const sigue = mostrarBotonSeguir ? await isFollowing(currentUser, post.usuario) : false;

        const mediaHTML = post.tipo === 'imagen'
            ? `<img src="${post.media}" alt="post">`
            : `<video src="${post.media}" loop muted preload="metadata"></video>`;

        const followBtnHTML = mostrarBotonSeguir
            ? `<button class="follow-btn ${sigue ? 'following' : ''}">${sigue ? 'Siguiendo' : 'Seguir'}</button>`
            : '';

        const postHTML = `
            <div class="post" data-post-id="${postId}" data-autor="${post.usuario}">
                <div class="post-header">
                    <div class="post-user" data-username="${post.usuario}">
                        <img src="${fotoAutor}" alt="avatar" class="post-avatar">
                        <span class="post-username">${post.usuario}</span>
                        ${followBtnHTML}
                    </div>
                    <button class="post-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
                </div>
                <div class="post-image">
                    ${mediaHTML}
                    <div class="post-heart-overlay"><i class="fa-solid fa-heart"></i></div>
                </div>
                <div class="post-body">
                    <div class="post-actions">
                        <div class="post-actions-left">
                            <button class="action-btn like-btn ${userLiked ? 'liked' : ''}">
                                <i class="fa-${userLiked ? 'solid' : 'regular'} fa-heart"></i>
                            </button>
                            <button class="action-btn comment-btn"><i class="fa-regular fa-comment"></i></button>
                            <button class="action-btn share-btn"><i class="fa-regular fa-paper-plane"></i></button>
                        </div>
                        <button class="action-btn save-btn"><i class="fa-regular fa-bookmark"></i></button>
                    </div>
                    <div class="post-likes">${likesCount} ${likesCount === 1 ? 'like' : 'likes'}</div>
                    <div class="post-caption">
                        <span class="post-username">${post.usuario}</span> ${post.caption}
                    </div>
                    <div class="post-comments"></div>
                    <div class="post-time">hace un momento</div>
                    <div class="post-add-comment">
                        <input type="text" placeholder="Agrega un comentario..." class="comment-input">
                        <button class="post-btn">Publicar</button>
                    </div>
                </div>
            </div>
        `;
        feedContainer.insertAdjacentHTML('beforeend', postHTML);
    }
    asignarEventosFeed();
}

async function asignarEventosFeed() {
    const currentUser = getUsuarioActual();

    document.querySelectorAll('.post video').forEach(video => {
        video.addEventListener('mouseenter', () => video.play().catch(e => {}));
        video.addEventListener('mouseleave', () => video.pause());
    });

    document.querySelectorAll('.follow-btn').forEach(btn => {
        const postDiv = btn.closest('.post');
        const autor = postDiv.getAttribute('data-autor');
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleFollow(currentUser, autor, btn);
        });
    });

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const postDiv = btn.closest('.post');
            const postId = postDiv.getAttribute('data-post-id');
            const autor = postDiv.getAttribute('data-autor');
            const icon = btn.querySelector('i');
            const likesSpan = postDiv.querySelector('.post-likes');
            let likes = parseInt(likesSpan.innerText);
            const userLiked = icon.classList.contains('fa-solid');

            if (!userLiked) {
                await likePost(postId, autor, currentUser);
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                btn.classList.add('liked');
                likes++;
                likesSpan.innerText = `${likes} ${likes === 1 ? 'like' : 'likes'}`;
                const overlay = postDiv.querySelector('.post-heart-overlay');
                overlay.classList.add('show');
                setTimeout(() => overlay.classList.remove('show'), 500);
            } else {
                await unlikePost(postId, currentUser);
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                btn.classList.remove('liked');
                likes--;
                likesSpan.innerText = `${likes} ${likes === 1 ? 'like' : 'likes'}`;
            }
        });
    });

    document.querySelectorAll('.post-image').forEach(imageDiv => {
        imageDiv.addEventListener('dblclick', async (e) => {
            e.stopPropagation();
            const likeBtn = imageDiv.closest('.post').querySelector('.like-btn');
            if (likeBtn) likeBtn.click();
        });
    });

    document.querySelectorAll('.post-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postDiv = btn.closest('.post');
            const input = postDiv.querySelector('.comment-input');
            const commentText = input.value.trim();
            if (commentText === '') return;
            const commentsContainer = postDiv.querySelector('.post-comments');
            const commentHTML = `<div class="post-comment"><span class="post-username">${currentUser}</span> ${commentText}</div>`;
            commentsContainer.insertAdjacentHTML('beforeend', commentHTML);
            input.value = '';
        });
    });

    document.querySelectorAll('.post-user').forEach(userDiv => {
        userDiv.addEventListener('click', () => {
            const username = userDiv.getAttribute('data-username');
            window.location.href = `profile.html?user=${username}`;
        });
    });
}

// ==================== INICIALIZAR ====================
async function init() {
    await asegurarUsuarioActual();
    usuarioActual = getUsuarioActual();
    await cargarHistorias();
    await cargarFeed();
}
init();