// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== PEXELS (para posts de ejemplo) ====================
const PEXELS_API_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru';

// ==================== DOM ====================
const avatarImg = document.getElementById('profileAvatar');
const usernameH2 = document.getElementById('profileUsername');
const bioDiv = document.getElementById('profileBio');
const postsCountSpan = document.getElementById('postsCount');
const followersCountSpan = document.getElementById('followersCount');
const followingCountSpan = document.getElementById('followingCount');
const actionButtonsDiv = document.getElementById('actionButtons');
const editAvatarBtn = document.getElementById('editAvatarBtn');
const editBioBtn = document.getElementById('editBioBtn');
const postsGrid = document.getElementById('postsGrid');

const editModal = document.getElementById('editModal');
const closeModal = document.querySelector('.close-modal');
const editForm = document.getElementById('editProfileForm');
const editFotoInput = document.getElementById('editFoto');
const editBioTextarea = document.getElementById('editBio');

let currentUser = null;      // username del usuario logueado (localStorage)
let profileUser = null;      // username cuyo perfil estamos viendo
let isOwnProfile = false;

// ==================== OBTENER USUARIO ACTUAL (localStorage) ====================
function getCurrentUser() {
    let user = localStorage.getItem("usuario");
    if (!user) {
        user = "juan";
        localStorage.setItem("usuario", user);
    }
    return user;
}

// ==================== OBTENER PERFIL DESDE SUPABASE (solo username, foto, estado) ====================
async function fetchUserProfile(username) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('username, foto, estado')
        .eq('username', username)
        .single();
    if (error) {
        console.error("Error fetching user:", error);
        return null;
    }
    return data;
}

// ==================== CONTADORES ====================
async function fetchFollowersCount(username) {
    const { count, error } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguido', username)
        .eq('estado', 'aprobado');
    return count || 0;
}

async function fetchFollowingCount(username) {
    const { count, error } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguidor', username)
        .eq('estado', 'aprobado');
    return count || 0;
}

// ==================== VERIFICAR SEGUIMIENTO ====================
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

// ==================== SEGUIR / DEJAR DE SEGUIR ====================
async function followUser(seguidor, seguido) {
    const { error } = await supabase
        .from('seguidores')
        .insert({ seguidor, seguido, estado: 'aprobado' });
    if (!error) {
        followersCountSpan.innerText = parseInt(followersCountSpan.innerText) + 1;
    }
}

async function unfollowUser(seguidor, seguido) {
    const { error } = await supabase
        .from('seguidores')
        .delete()
        .eq('seguidor', seguidor)
        .eq('seguido', seguido);
    if (!error) {
        followersCountSpan.innerText = parseInt(followersCountSpan.innerText) - 1;
    }
}

// ==================== CARGAR POSTS DE EJEMPLO (Pexels) ====================
async function loadSamplePosts() {
    postsGrid.innerHTML = '<div style="text-align:center;">Cargando publicaciones...</div>';
    try {
        const response = await fetch('https://api.pexels.com/v1/curated?per_page=9', {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        const data = await response.json();
        const posts = data.photos;
        postsGrid.innerHTML = '';
        posts.forEach(photo => {
            const div = document.createElement('div');
            div.className = 'post-item';
            div.innerHTML = `<img src="${photo.src.small}" alt="post">`;
            div.addEventListener('click', () => {
                alert('Aquí podrías abrir el detalle de la publicación');
            });
            postsGrid.appendChild(div);
        });
        postsCountSpan.innerText = posts.length;
    } catch (error) {
        console.error(error);
        postsGrid.innerHTML = '<div style="text-align:center;">Error al cargar publicaciones</div>';
    }
}

// ==================== RENDERIZAR PERFIL ====================
async function renderProfile() {
    if (!profileUser) return;
    const userData = await fetchUserProfile(profileUser);
    if (!userData) {
        usernameH2.innerText = 'Usuario no encontrado';
        bioDiv.innerText = '';
        avatarImg.src = 'https://via.placeholder.com/150';
        return;
    }
    usernameH2.innerText = userData.username;
    avatarImg.src = userData.foto || 'https://via.placeholder.com/150';
    bioDiv.innerText = userData.estado || 'Sin biografía';

    // Contadores
    const followers = await fetchFollowersCount(profileUser);
    const following = await fetchFollowingCount(profileUser);
    followersCountSpan.innerText = followers;
    followingCountSpan.innerText = following;

    // Botones de acción
    actionButtonsDiv.innerHTML = '';
    if (isOwnProfile) {
        editAvatarBtn.style.display = 'flex';
        editBioBtn.style.display = 'inline-block';
        const editProfileBtn = document.createElement('button');
        editProfileBtn.className = 'edit-btn';
        editProfileBtn.innerText = 'Editar perfil';
        editProfileBtn.addEventListener('click', () => openEditModal(userData));
        actionButtonsDiv.appendChild(editProfileBtn);
    } else {
        editAvatarBtn.style.display = 'none';
        editBioBtn.style.display = 'none';
        const sigue = await isFollowing(currentUser, profileUser);
        const followBtn = document.createElement('button');
        followBtn.className = `follow-btn ${sigue ? 'following' : ''}`;
        followBtn.innerText = sigue ? 'Siguiendo' : 'Seguir';
        followBtn.addEventListener('click', async () => {
            if (sigue) {
                await unfollowUser(currentUser, profileUser);
                followBtn.innerText = 'Seguir';
                followBtn.classList.remove('following');
            } else {
                await followUser(currentUser, profileUser);
                followBtn.innerText = 'Siguiendo';
                followBtn.classList.add('following');
            }
        });
        actionButtonsDiv.appendChild(followBtn);
        // Botón mensaje
        const msgBtn = document.createElement('button');
        msgBtn.className = 'message-btn';
        msgBtn.innerText = 'Mensaje';
        msgBtn.addEventListener('click', () => {
            window.location.href = `messages.html?user=${profileUser}`;
        });
        actionButtonsDiv.appendChild(msgBtn);
    }
}

// ==================== EDITAR PERFIL (MODAL) ====================
function openEditModal(userData) {
    editFotoInput.value = userData.foto || '';
    editBioTextarea.value = userData.estado || '';
    editModal.style.display = 'flex';
}
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newFoto = editFotoInput.value.trim();
    const newBio = editBioTextarea.value.trim();
    const { error } = await supabase
        .from('usuarios')
        .update({ foto: newFoto || null, estado: newBio || null })
        .eq('username', currentUser);
    if (!error) {
        avatarImg.src = newFoto || 'https://via.placeholder.com/150';
        bioDiv.innerText = newBio || 'Sin biografía';
        editModal.style.display = 'none';
    } else {
        alert('Error al guardar: ' + error.message);
    }
});
closeModal.addEventListener('click', () => editModal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === editModal) editModal.style.display = 'none'; });

// ==================== OBTENER USUARIO DE LA URL ====================
function getProfileUserFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) return userParam;
    return getCurrentUser();  // si no hay parámetro, ver el propio perfil
}

// ==================== INICIALIZAR ====================
async function init() {
    currentUser = getCurrentUser();
    profileUser = getProfileUserFromUrl();
    isOwnProfile = (profileUser === currentUser);
    await renderProfile();
    await loadSamplePosts();
}
init();