// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const listaNotificaciones = document.getElementById('listaNotificaciones');
let usuarioActual = null;

// Obtener usuario actual desde localStorage
function getCurrentUser() {
    let user = localStorage.getItem("usuario");
    if (!user) user = "juan";
    return user;
}

// Obtener foto de un usuario
async function getFotoUsuario(username) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('foto')
        .eq('username', username)
        .maybeSingle();
    if (error || !data) return 'https://via.placeholder.com/50';
    return data.foto || 'https://via.placeholder.com/50';
}

// Formatear tiempo relativo
function formatRelativeTime(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} minutos`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    return fecha.toLocaleDateString();
}

// Obtener notificaciones del usuario actual
async function cargarNotificaciones() {
    const currentUser = getCurrentUser();
    // Las notificaciones se guardan en la tabla "notificaciones"
    const { data, error } = await supabaseClient
        .from('notificaciones')
        .select('*')
        .eq('usuario_destino', currentUser)
        .order('fecha', { ascending: false });

    if (error) {
        console.error(error);
        listaNotificaciones.innerHTML = '<div class="empty-msg">Error al cargar notificaciones</div>';
        return;
    }
    if (!data || data.length === 0) {
        listaNotificaciones.innerHTML = '<div class="empty-msg">No hay notificaciones</div>';
        return;
    }

    // Agrupar por fecha
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const grupos = { 'Hoy': [], 'Esta semana': [], 'Este mes': [], 'Anterior': [] };
    for (const notif of data) {
        const fecha = new Date(notif.fecha);
        if (fecha >= hoy) grupos['Hoy'].push(notif);
        else if (fecha >= inicioSemana) grupos['Esta semana'].push(notif);
        else if (fecha >= inicioMes) grupos['Este mes'].push(notif);
        else grupos['Anterior'].push(notif);
    }

    let html = '';
    for (const [titulo, lista] of Object.entries(grupos)) {
        if (lista.length === 0) continue;
        html += `<div class="grupo-fecha"><h4>${titulo}</h4>`;
        for (const notif of lista) {
            const foto = await getFotoUsuario(notif.usuario_origen);
            const tiempo = formatRelativeTime(notif.fecha);
            let texto = '';
            switch (notif.tipo) {
                case 'like':
                    texto = `<strong>${notif.usuario_origen}</strong> le gustó tu publicación.`;
                    break;
                case 'comentario':
                    texto = `<strong>${notif.usuario_origen}</strong> comentó tu publicación.`;
                    break;
                case 'solicitud_seguimiento':
                    texto = `<strong>${notif.usuario_origen}</strong> solicitó seguirte.`;
                    break;
                default:
                    texto = `<strong>${notif.usuario_origen}</strong> interactuó contigo.`;
            }
            html += `
                <div class="notificacion" data-id="${notif.id}" data-tipo="${notif.tipo}" data-origen="${notif.usuario_origen}" data-referencia="${notif.referencia_id || ''}">
                    <img src="${foto}" alt="@${notif.usuario_origen}">
                    <div class="contenido">
                        <div class="texto">${texto}</div>
                        <div class="tiempo">${tiempo}</div>
                    </div>
                    ${notif.tipo === 'solicitud_seguimiento' && notif.estado_pendiente ? `
                    <div class="acciones">
                        <button class="confirmar">Confirmar</button>
                        <button class="eliminar">Eliminar</button>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        html += `</div>`;
    }
    listaNotificaciones.innerHTML = html;

    // Asignar eventos a cada notificación
    document.querySelectorAll('.notificacion').forEach(div => {
        const id = div.getAttribute('data-id');
        const tipo = div.getAttribute('data-tipo');
        const origen = div.getAttribute('data-origen');
        const referencia = div.getAttribute('data-referencia');

        div.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            if (tipo === 'solicitud_seguimiento') {
                window.location.href = `profile.html?user=${origen}`;
            } else if (tipo === 'like' || tipo === 'comentario') {
                alert(`Abrir publicación: ${referencia}`);
            } else {
                window.location.href = `profile.html?user=${origen}`;
            }
        });

        const btnConfirmar = div.querySelector('.confirmar');
        const btnEliminar = div.querySelector('.eliminar');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async (e) => {
                e.stopPropagation();
                // Aceptar solicitud: insertar en seguidores y eliminar notificación
                await supabaseClient
                    .from('seguidores')
                    .insert({ seguidor: origen, seguido: getCurrentUser(), estado: 'aprobado' });
                await supabaseClient.from('notificaciones').delete().eq('id', id);
                div.remove();
            });
        }
        if (btnEliminar) {
            btnEliminar.addEventListener('click', async (e) => {
                e.stopPropagation();
                await supabaseClient.from('notificaciones').delete().eq('id', id);
                div.remove();
            });
        }
    });
}

// Inicializar
async function init() {
    usuarioActual = getCurrentUser();
    await cargarNotificaciones();
}
init();