// =========================
// 1. VARIABLES GLOBALES
// =========================

// Referencias al DOM - Perfil (usando querySelector)
const profileAvatar = document.querySelector('#profileAvatar');
const profileUsername = document.querySelector('#profileUsername');
const profileRealName = document.querySelector('#profileRealName');
const profileBio = document.querySelector('#profileBio');
const profileLink = document.querySelector('#profileLink');
const statPosts = document.querySelector('#statPosts');
const statFollowers = document.querySelector('#statFollowers');
const statFollowing = document.querySelector('#statFollowing');
const navAvatar = document.querySelector('#navAvatar');

// Referencias al DOM - Contenedores
const storiesContainer = document.querySelector('#storiesContainer');
const galleryContainer = document.querySelector('#galleryContainer');

// Referencias al DOM - Botones
const btnEditProfile = document.querySelector('#btnEditProfile');
const btnShareProfile = document.querySelector('#btnShareProfile');
const btnSwitchAccount = document.querySelector('#btnSwitchAccount');

// Referencias al DOM - Modal de Historia
const storyModal = document.querySelector('#storyModal');
const closeStory = document.querySelector('#closeStory');
const storyImage = document.querySelector('#storyImage');
const storyName = document.querySelector('#storyName');
const storyDescription = document.querySelector('#storyDescription');

// Referencias al DOM - Modal de Publicación
const postModal = document.querySelector('#postModal');
const closePost = document.querySelector('#closePost');
const postImage = document.querySelector('#postImage');
const postUsername = document.querySelector('#postUsername');
const postUserAvatar = document.querySelector('#postUserAvatar');
const postDescription = document.querySelector('#postDescription');
const postLikes = document.querySelector('#postLikes');
const postComments = document.querySelector('#postComments');
const postShares = document.querySelector('#postShares');

// Referencias al DOM - Modal de Editar Perfil
const editModal = document.querySelector('#editModal');
const closeEdit = document.querySelector('#closeEdit');
const editForm = document.querySelector('#editForm');
const editName = document.querySelector('#editName');
const editBio = document.querySelector('#editBio');
const editLink = document.querySelector('#editLink');
const cancelEdit = document.querySelector('#cancelEdit');

// Estado de la aplicación
let currentUserId = 0;       // Índice del usuario activo en el array
let currentPostIndex = 0;    // Índice de la publicación abierta
let currentStoryIndex = 0;   // Índice de la historia abierta

// =========================
// 2. DATOS DE USUARIOS
// =========================

const users = [
  {
    id: 1,
    username: 'maria_dev',
    fullName: 'María García',
    avatar: 'https://i.pravatar.cc/300?u=maria_dev',
    bio: '✈️ Viajera | 📸 Fotógrafa | 🌍 Explorando el mundo\n📍 Basada en Madrid',
    link: 'www.misviajes.com',
    posts: 42,
    followers: 12580,
    following: 843,
    stories: [
      { name: 'Viajes', emoji: '✈️', color: '#FF6B6B', gradient: 'linear-gradient(135deg, #FF6B6B, #FFA07A)', description: 'Mis aventuras alrededor del mundo 🌎' },
      { name: 'Comida', emoji: '🍕', color: '#FFD93D', gradient: 'linear-gradient(135deg, #FFD93D, #FF8C42)', description: 'Los mejores restaurantes que he visitado 🍝' },
      { name: 'Arte', emoji: '🎨', color: '#6C5CE7', gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', description: 'Galerías y museos imperdibles 🖼️' },
      { name: 'Playas', emoji: '🏖️', color: '#00CEC9', gradient: 'linear-gradient(135deg, #00CEC9, #81ECEC)', description: 'Paradises tropicales que debes conocer 🌴' }
    ],
    postsData: [
      { image: 'https://picsum.photos/seed/maria1/400/400', likes: 1234, comments: 56, shares: 12, description: 'Atardecer en la playa 🌅' },
      { image: 'https://picsum.photos/seed/maria2/400/400', likes: 2341, comments: 89, shares: 34, description: 'Cafecito de las mañanas ☕' },
      { image: 'https://picsum.photos/seed/maria3/400/400', likes: 3456, comments: 102, shares: 45, description: 'Nueva aventura en la montaña 🏔️' },
      { image: 'https://picsum.photos/seed/maria4/400/400', likes: 4567, comments: 134, shares: 67, description: 'City tour por el centro histórico 🏛️' },
      { image: 'https://picsum.photos/seed/maria5/400/400', likes: 5678, comments: 210, shares: 89, description: 'Atardecer desde el rooftop 🌇' },
      { image: 'https://picsum.photos/seed/maria6/400/400', likes: 6789, comments: 56, shares: 23, description: 'Explorando nuevos horizontes 🚀' },
      { image: 'https://picsum.photos/seed/maria7/400/400', likes: 7890, comments: 178, shares: 91, description: 'Día de campo en la naturaleza 🌿' },
      { image: 'https://picsum.photos/seed/maria8/400/400', likes: 8901, comments: 45, shares: 12, description: 'Arquitectura moderna por la ciudad 🏙️' },
      { image: 'https://picsum.photos/seed/maria9/400/400', likes: 9012, comments: 67, shares: 34, description: 'Atardecer mágico en la costa 🌊' }
    ]
  },
  {
    id: 2,
    username: 'carlos_tech',
    fullName: 'Carlos Mendoza',
    avatar: 'https://i.pravatar.cc/300?u=carlos_tech',
    bio: '💻 Desarrollador web | 🚀 Tech enthusiast\n📍 Basado en México DF',
    link: 'www.carlosmendoza.dev',
    posts: 36,
    followers: 8750,
    following: 521,
    stories: [
      { name: 'Código', emoji: '💻', color: '#0984E3', gradient: 'linear-gradient(135deg, #0984E3, #74B9FF)', description: 'Mis proyectos de código abierto 🧑‍💻' },
      { name: 'Gaming', emoji: '🎮', color: '#6C5CE7', gradient: 'linear-gradient(135deg, #6C5CE7, #FD79A8)', description: 'Gameplay y reseñas de videojuegos 🕹️' },
      { name: 'Música', emoji: '🎵', color: '#FD79A8', gradient: 'linear-gradient(135deg, #FD79A8, #FDCB6E)', description: 'Playlists y conciertos 🎶' },
      { name: 'Gadgets', emoji: '📱', color: '#00B894', gradient: 'linear-gradient(135deg, #00B894, #55EFC4)', description: 'Reviews de los últimos gadgets 📲' }
    ],
    postsData: [
      { image: 'https://picsum.photos/seed/carlos1/400/400', likes: 892, comments: 34, shares: 8, description: 'Setup de trabajo minimalista 🖥️' },
      { image: 'https://picsum.photos/seed/carlos2/400/400', likes: 1567, comments: 78, shares: 23, description: 'Nuevo teclado mecánico ⌨️' },
      { image: 'https://picsum.photos/seed/carlos3/400/400', likes: 2345, comments: 91, shares: 45, description: 'Mi estación de trabajo actual 🎮' },
      { image: 'https://picsum.photos/seed/carlos4/400/400', likes: 678, comments: 23, shares: 12, description: 'Café y código ☕' },
      { image: 'https://picsum.photos/seed/carlos5/400/400', likes: 3456, comments: 123, shares: 67, description: 'Conferencia de tecnología 2026 🎤' },
      { image: 'https://picsum.photos/seed/carlos6/400/400', likes: 1234, comments: 56, shares: 34, description: 'Mi nuevo monitor ultra wide 🖥️' },
      { image: 'https://picsum.photos/seed/carlos7/400/400', likes: 2345, comments: 89, shares: 12, description: 'Hackathon ganado 🏆' },
      { image: 'https://picsum.photos/seed/carlos8/400/400', likes: 4567, comments: 145, shares: 78, description: 'Meetup de desarrolladores 👨‍💻' },
      { image: 'https://picsum.photos/seed/carlos9/400/400', likes: 789, comments: 34, shares: 9, description: 'Atardecer desde la oficina 🌆' }
    ]
  }
];

// =========================
// 3. CARGA DEL PERFIL
// =========================

function loadProfile(userId) {
  const user = users[userId];

  // Actualizar datos del perfil
  profileAvatar.src = user.avatar;
  navAvatar.src = user.avatar;
  profileUsername.textContent = user.username;
  profileRealName.textContent = user.fullName;
  profileBio.innerHTML = user.bio.replace(/\n/g, '<br>');
  profileLink.textContent = user.link;
  profileLink.href = 'https://' + user.link;
  statPosts.textContent = user.posts;
  statFollowers.textContent = formatNumber(user.followers);
  statFollowing.textContent = user.following;

  // Renderizar historias y publicaciones
  renderStories(user.stories);
  renderGallery(user.postsData);
}

// =========================
// FUNCIÓN AUXILIAR
// =========================

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return num.toString();
}

// =========================
// 4. APERTURA DE HISTORIAS
// =========================

function openStory(index) {
  const user = users[currentUserId];
  const story = user.stories[index];
  currentStoryIndex = index;

  // Mostrar la historia en el modal
  storyImage.style.background = story.gradient;
  storyImage.textContent = story.emoji;
  storyName.textContent = story.name;
  storyDescription.textContent = story.description;

  storyModal.classList.add('modal-overlay--open');
}

function closeStoryModal() {
  storyModal.classList.remove('modal-overlay--open');
}

// =========================
// 5. APERTURA DE PUBLICACIONES
// =========================

function openPost(index) {
  const user = users[currentUserId];
  const post = user.postsData[index];
  currentPostIndex = index;

  // Limpiar contenido previo
  postImage.innerHTML = '';

  // Crear y añadir la imagen
  const img = document.createElement('img');
  img.src = post.image;
  img.alt = 'Publicación';
  img.loading = 'lazy';
  postImage.appendChild(img);

  // Rellenar datos de la publicación
  postUsername.textContent = user.username;
  postUserAvatar.src = user.avatar;
  postDescription.textContent = post.description;
  postLikes.textContent = formatNumber(post.likes);
  postComments.textContent = formatNumber(post.comments);
  postShares.textContent = formatNumber(post.shares);

  postModal.classList.add('modal-overlay--open');
}

function closePostModal() {
  postModal.classList.remove('modal-overlay--open');
}

// =========================
// 6. EDICIÓN DE PERFIL
// =========================

function openEditModal() {
  const user = users[currentUserId];

  // Rellenar el formulario con los datos actuales
  editName.value = user.fullName;
  editBio.value = user.bio;
  editLink.value = user.link;

  editModal.classList.add('modal-overlay--open');
}

function closeEditModal() {
  editModal.classList.remove('modal-overlay--open');
}

function saveProfile(event) {
  event.preventDefault();

  const user = users[currentUserId];

  // Obtener valores del formulario
  const newName = editName.value.trim();
  const newBio = editBio.value.trim();
  const newLink = editLink.value.trim();

  // Actualizar los datos del usuario en memoria
  if (newName) user.fullName = newName;
  if (newBio) user.bio = newBio;
  if (newLink) user.link = newLink;

  // Reflejar los cambios en la pantalla
  profileRealName.textContent = user.fullName;
  profileBio.innerHTML = user.bio.replace(/\n/g, '<br>');
  profileLink.textContent = user.link;

  // Cerrar el modal
  closeEditModal();
}

// =========================
// 7. CAMBIO DE CUENTA
// =========================

function switchAccount() {
  // Alternar entre el usuario 0 y 1
  currentUserId = currentUserId === 0 ? 1 : 0;

  // Recargar todo el perfil con el nuevo usuario
  loadProfile(currentUserId);

  // Cerrar cualquier modal abierto
  closeStoryModal();
  closePostModal();
  closeEditModal();
}

// =========================
// 8. RENDERIZADO DE HISTORIAS
// =========================

function renderStories(stories) {
  storiesContainer.innerHTML = '';

  stories.forEach((story, index) => {
    const storyElement = document.createElement('div');
    storyElement.className = 'story';

    storyElement.innerHTML = `
      <div class="story__ring" style="background: ${story.gradient}">
        <div class="story__image" style="background-color: ${story.color}">
          ${story.emoji}
        </div>
      </div>
      <span class="story__name">${story.name}</span>
    `;

    storyElement.addEventListener('click', function () {
      openStory(index);
    });

    storiesContainer.appendChild(storyElement);
  });
}

// =========================
// RENDERIZADO DE PUBLICACIONES
// =========================

function renderGallery(posts) {
  galleryContainer.innerHTML = '';

  posts.forEach((post, index) => {
    const item = document.createElement('div');
    item.className = 'gallery__item';

    item.innerHTML = `
      <img class="gallery__image" src="${post.image}" alt="Publicación" loading="lazy">
      <div class="gallery__overlay">
        <span class="gallery__overlay-stat">❤️ ${formatNumber(post.likes)}</span>
        <span class="gallery__overlay-stat">💬 ${formatNumber(post.comments)}</span>
      </div>
    `;

    item.addEventListener('click', function () {
      openPost(index);
    });

    galleryContainer.appendChild(item);
  });
}

// =========================
// 9. EVENTOS GENERALES
// =========================

// Cerrar modales al hacer clic en la X
closeStory.addEventListener('click', closeStoryModal);
closePost.addEventListener('click', closePostModal);
closeEdit.addEventListener('click', closeEditModal);
cancelEdit.addEventListener('click', closeEditModal);

// Cerrar modales al hacer clic fuera del contenido (usando querySelectorAll)
document.querySelectorAll('.modal-overlay').forEach(function (modal) {
  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      this.classList.remove('modal-overlay--open');
    }
  });
});

// Botones principales
btnEditProfile.addEventListener('click', openEditModal);
btnSwitchAccount.addEventListener('click', switchAccount);
btnShareProfile.addEventListener('click', function () {
  alert('¡Enlace del perfil copiado al portapapeles! 📋');
});

// Formulario de edición
editForm.addEventListener('submit', saveProfile);

// Cerrar con tecla Escape (usando querySelectorAll)
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay--open').forEach(function (modal) {
      modal.classList.remove('modal-overlay--open');
    });
  }
});

// =========================
// INICIALIZACIÓN
// =========================

loadProfile(currentUserId);
