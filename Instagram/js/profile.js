// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';


var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const DEFAULT_AVATAR = 'https://i.imgur.com/yXOvdOS.png';

// ==================== CARGAR PERFIL ====================
async function cargarPerfil() {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) {
        console.log("No hay usuario logueado");
        mostrarUsuarioNoEncontrado();
        return;
    }

    const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("username", usuario)
        .maybeSingle();

    if (error || !data) {
        console.error("Error o usuario no encontrado", error);
        mostrarUsuarioNoEncontrado();
        return;
    }

    document.getElementById("profileUsername").innerText = data.username;
    document.getElementById("profileName").innerText = data.nombre || data.username;
    document.getElementById("profileAvatar").src = data.foto || DEFAULT_AVATAR;
}

function mostrarUsuarioNoEncontrado() {
    document.getElementById("profileUsername").innerText = "Usuario no encontrado";
    document.getElementById("profileName").innerText = "Inicia sesión nuevamente";
}

// ==================== CONTROL DE PESTAÑAS ====================
function mostrarPublicaciones() {
    const grid = document.getElementById("postsGrid");
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#888;">
            <i class="fa-regular fa-image" style="font-size:48px; margin-bottom:15px; display:block;"></i>
            <p>No hay publicaciones aún</p>
        </div>
    `;
}

function mostrarGuardados() {
    const grid = document.getElementById("postsGrid");
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
            <i class="fa-regular fa-bookmark" style="font-size:64px; color:#fff; margin-bottom:20px; display:block;"></i>
            <h3 style="font-size:24px; margin-bottom:12px;">Solo tú puedes ver lo que has guardado</h3>
            <p style="font-size:16px; color:#a8a8a8; max-width:400px; margin:0 auto;">
                Guarda fotos y vídeos que quieras volver a ver. Nadie recibirá ninguna notificación y solo tú podrás ver lo que has guardado.
            </p>
        </div>
    `;
}

function mostrarEtiquetadas() {
    const grid = document.getElementById("postsGrid");
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
            <i class="fa-regular fa-id-badge" style="font-size:64px; color:#fff; margin-bottom:20px; display:block;"></i>
            <h3 style="font-size:24px; margin-bottom:12px;">Fotos en las que apareces</h3>
            <p style="font-size:16px; color:#a8a8a8; max-width:400px; margin:0 auto;">
                Cuando las personas te etiqueten en fotos, aparecerán aquí.
            </p>
        </div>
    `;
}

// ==================== INTERACTIVIDAD ====================
document.addEventListener("DOMContentLoaded", () => {
    cargarPerfil();

    // Mostrar publicaciones por defecto
    mostrarPublicaciones();

    // ---- SIDEBAR ----
    document.querySelector(".menuInferior")?.addEventListener("click", () => alert("Menú lateral - Próximamente"));

    // ---- HEADER ----
    document.querySelector(".edit-btn")?.addEventListener("click", () => alert("Editar perfil - Próximamente"));
    document.querySelector(".archive-btn")?.addEventListener("click", () => alert("Ver archivo - Próximamente"));
    document.querySelector(".edit-avatar-btn")?.addEventListener("click", () => alert("Cambiar foto de perfil - Próximamente"));

    // ---- HISTORIAS ----
    document.querySelector(".story-circle")?.addEventListener("click", () => alert("Crear nueva historia - Próximamente"));

    // ---- TABS (cambio de contenido) ----
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // Cambiar clase activa
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // Mostrar contenido según el ícono
            const icon = tab.querySelector("i");
            if (icon.classList.contains("fa-table-cells")) {
                mostrarPublicaciones();
            } else if (icon.classList.contains("fa-bookmark")) {
                mostrarGuardados();
            } else if (icon.classList.contains("fa-id-badge")) {
                mostrarEtiquetadas();
            }
        });
    });

    // ---- CARDS DEL WELCOME BOX ----
    document.querySelector(".card:first-child button")?.addEventListener("click", () => alert("Compartir primera foto - Próximamente"));
    document.querySelector(".card:nth-child(2) button")?.addEventListener("click", () => alert("Añadir número de teléfono - Próximamente"));
    document.querySelector(".card:last-child button")?.addEventListener("click", () => alert("Añadir foto de perfil - Próximamente"));
});