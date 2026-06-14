// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Usuario actual
let usuarioActual = null;

// Elementos DOM
const listaNotificaciones = document.getElementById('listaNotificaciones');

// Obtener usuario logueado
async function obtenerUsuarioActual() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) {
        // No logueado, redirigir a login (opcional)
        window.location.href = 'login.html';
        return null;
    }
    // Buscar username en tabla 'usuarios' por email
    const { data, error: userError } = await supabaseClient
        .from('usuarios')
        .select('username')
        .eq('email', user.email)
        .single();
    if (userError || !data) {
        console.error('Usuario no encontrado en tabla usuarios');
        return null;
    }
    return data.username;
}

// Cargar notificaciones desde Supabase
async function cargarNotificaciones() {
    if (!usuarioActual) return;
    const { data, error } = await supabaseClient
        .from('notificaciones')
        .select('*')
        .eq('usuario_destino', usuarioActual)
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
    const grupos = agruparPorFecha(data);
    renderizarNotificaciones(grupos);
}

function agruparPorFecha(notificaciones) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const grupos = {
        'Hoy': [],
        'Esta semana': [],
        'Este mes': [],
        'Anterior': []
    };

    notificaciones.forEach(notif => {
        const fecha = new Date(notif.fecha);
        if (fecha >= hoy) {
            grupos['Hoy'].push(notif);
        } else if (fecha >= inicioSemana) {
            grupos['Esta semana'].push(notif);
        } else if (fecha >= inicioMes) {
            grupos['Este mes'].push(notif);
        } else {
            grupos['Anterior'].push(notif);
        }
    });
    return grupos;
}

async function renderizarNotificaciones(grupos) {
    let html = '';
    for (const [titulo, lista] of Object.entries(grupos)) {
        if (lista.length === 0) continue;
        html += `<div class="grupo-fecha"><h4>${titulo}</h4>`;
        for (const notif of lista) {
            // Obtener datos del usuario origen (foto, etc.)
            const usuarioOrigen = await obtenerInfoUsuario(notif.usuario_origen);
            const foto = usuarioOrigen?.foto || 'https://via.placeholder.com/50';
            const texto = formatearTextoNotificacion(notif);
            const tiempo = formatRelativeTime(notif.fecha);
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

        // Evento click en toda la notificación (excepto botones)
        div.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            // Redirigir según tipo
            if (tipo === 'solicitud_seguimiento') {
                // Ir al perfil del solicitante
                window.location.href = `profile.html?user=${origen}`;
            } else if (tipo === 'like' || tipo === 'comentario') {
                // Simular ir a la publicación (podrías construir una URL)
                alert(`Abrir publicación con ID: ${referencia}`);
                // window.location.href = `post.html?id=${referencia}`;
            } else {
                window.location.href = `profile.html?user=${origen}`;
            }
        });

        // Botones de confirmar/rechazar solicitud
        const btnConfirmar = div.querySelector('.confirmar');
        const btnEliminar = div.querySelector('.eliminar');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async (e) => {
                e.stopPropagation();
                await responderSolicitud(id, origen, true);
                div.remove(); // remover visualmente
            });
        }
        if (btnEliminar) {
            btnEliminar.addEventListener('click', async (e) => {
                e.stopPropagation();
                await responderSolicitud(id, origen, false);
                div.remove();
            });
        }
    });
}

async function obtenerInfoUsuario(username) {
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('foto, estado')
        .eq('username', username)
        .single();
    if (error) return null;
    return data;
}

function formatearTextoNotificacion(notif) {
    const usuario = `<strong>${notif.usuario_origen}</strong>`;
    switch (notif.tipo) {
        case 'like':
            return `${usuario} le gustó tu publicación.`;
        case 'comentario':
            return `${usuario} comentó tu publicación.`;
        case 'solicitud_seguimiento':
            return `${usuario} solicitó seguirte.`;
        case 'mencion':
            return `${usuario} te mencionó en un comentario.`;
        case 'historia':
            return `${usuario} reaccionó a tu historia.`;
        default:
            return `${usuario} interactuó contigo.`;
    }
}

function formatRelativeTime(fechaISO) {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffHoras = Math.floor((ahora - fecha) / (1000 * 60 * 60));
    if (diffHoras < 1) return 'hace unos minutos';
    if (diffHoras < 24) return `hace ${diffHoras} horas`;
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias === 1) return 'ayer';
    if (diffDias < 7) return `hace ${diffDias} días`;
    return fecha.toLocaleDateString();
}

async function responderSolicitud(notificacionId, usernameOrigen, aceptar) {
    if (!usuarioActual) return;
    if (aceptar) {
        // Insertar en tabla seguidores
        await supabaseClient
            .from('seguidores')
            .insert({ seguidor: usernameOrigen, seguido: usuarioActual, estado: 'aprobado' });
    }
    // Eliminar la notificación
    await supabaseClient
        .from('notificaciones')
        .delete()
        .eq('id', notificacionId);
    // Opcional: si se rechaza, solo se elimina la notificación.
}

// Inicializar
async function init() {
    usuarioActual = await obtenerUsuarioActual();
    if (usuarioActual) {
        cargarNotificaciones();
    }
}
init();