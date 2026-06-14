// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== API PEXELS ====================
const PEXELS_API_KEY = '3Ve4lhcRpHxtUtwD8U9lmKLQH6zLrTPortE2N7sUUVV2B5F5MNEnW7Ru';

// ==================== DOM ====================
const searchInput = document.getElementById('searchInput');
const resultadosDiv = document.getElementById('resultados');

let debounceTimer;

// ----- 1. CARGAR EXPLORE AL INICIAR (publicaciones y reels) -----
async function cargarExplore() {
    resultadosDiv.innerHTML = '<div class="empty-msg">Cargando contenido popular...</div>';
    try {
        // Obtener fotos populares de Pexels (para publicaciones)
        const fotosResp = await fetch('https://api.pexels.com/v1/curated?per_page=9', {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        const fotosData = await fotosResp.json();
        
        // Obtener videos populares de Pexels (para reels)
        const videosResp = await fetch('https://api.pexels.com/videos/popular?per_page=6', {
            headers: { 'Authorization': PEXELS_API_KEY }
        });
        const videosData = await videosResp.json();
        
        // Mezclar fotos y videos en un solo array (intercalado)
        const fotos = fotosData.photos.map(foto => ({
            type: 'image',
            src: foto.src.medium,
            user: foto.photographer,
            url: foto.url
        }));
        const videos = videosData.videos.map(video => {
            const videoFile = video.video_files.find(f => f.quality === 'hd' || f.quality === 'sd') || video.video_files[0];
            return {
                type: 'video',
                src: videoFile.link,
                user: video.user.name,
                url: video.url
            };
        });
        
        // Mezclar: alternar imágenes y videos (puedes cambiar el orden)
        const mixed = [];
        const maxLen = Math.max(fotos.length, videos.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < fotos.length) mixed.push(fotos[i]);
            if (i < videos.length) mixed.push(videos[i]);
        }
        
        renderExplore(mixed);
    } catch (error) {
        console.error(error);
        resultadosDiv.innerHTML = '<div class="empty-msg">Error al cargar el feed. Intenta más tarde.</div>';
    }
}

function renderExplore(items) {
    if (!items.length) {
        resultadosDiv.innerHTML = '<div class="empty-msg">No hay contenido disponible.</div>';
        return;
    }
    resultadosDiv.innerHTML = items.map(item => {
        if (item.type === 'image') {
            return `
                <div class="post-card">
                    <img src="${item.src}" alt="Publicación">
                    <div class="info">📷 ${item.user}</div>
                </div>
            `;
        } else {
            return `
                <div class="reel-card">
                    <video src="${item.src}" muted loop preload="metadata"></video>
                    <div class="info">🎬 ${item.user}</div>
                </div>
            `;
        }
    }).join('');
    
    // Agregar efecto hover a los videos (play/pause)
    document.querySelectorAll('.reel-card video').forEach(video => {
        video.addEventListener('mouseenter', () => video.play().catch(e => {}));
        video.addEventListener('mouseleave', () => video.pause());
    });
}

// ----- 2. BÚSQUEDA DE USUARIOS (cuando se escribe) -----
async function buscarUsuarios(termino) {
    resultadosDiv.innerHTML = '<div class="empty-msg">Buscando usuarios...</div>';
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('username, estado, foto')
        .ilike('username', `%${termino}%`)
        .limit(20);
    if (error) {
        console.error(error);
        resultadosDiv.innerHTML = '<div class="empty-msg">Error al buscar usuarios</div>';
        return;
    }
    if (!data || data.length === 0) {
        resultadosDiv.innerHTML = '<div class="empty-msg">No se encontraron usuarios con ese nombre</div>';
        return;
    }
    resultadosDiv.innerHTML = data.map(usuario => `
        <div class="usuario-card" data-username="${usuario.username}">
            <img src="${usuario.foto || 'https://via.placeholder.com/80'}" alt="avatar">
            <h4>${usuario.username}</h4>
            <p>${usuario.estado || 'Sin estado'}</p>
        </div>
    `).join('');
    
    document.querySelectorAll('.usuario-card').forEach(card => {
        card.addEventListener('click', () => {
            const username = card.getAttribute('data-username');
            alert(`Abrir conversación con @${username}`); // Puedes redirigir a messages.html
        });
    });
}

// ----- 3. CONTROL DEL INPUT (con debounce) -----
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const termino = e.target.value.trim();
    if (termino === '') {
        // Si no hay texto, volvemos al explore
        cargarExplore();
    } else {
        debounceTimer = setTimeout(() => {
            buscarUsuarios(termino);
        }, 400);
    }
});

// ----- 4. INICIALIZAR: mostrar explore al cargar la página -----
cargarExplore();