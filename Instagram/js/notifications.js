const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getCurrentUser() {
  return localStorage.getItem('usuario');
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

async function cargarNotificaciones() {
  const container = document.getElementById('listaNotificaciones');
  const user = getCurrentUser();
  if (!user) { container.innerHTML = '<div class="empty-msg">Inicia sesión para ver notificaciones</div>'; return; }

  // Get notifications
  const { data, error } = await supabase.from('notificaciones')
    .select('*')
    .eq('usuario_destino', user)
    .order('fecha', { ascending: false })
    .limit(50);

  if (error) { container.innerHTML = '<div class="empty-msg">Error al cargar</div>'; return; }

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-msg">No hay notificaciones aún</div>';
    return;
  }

  // Group
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(hoy); inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const grupos = { 'Hoy': [], 'Esta semana': [], 'Este mes': [], 'Anterior': [] };

  for (const n of data) {
    const f = new Date(n.fecha);
    if (f >= hoy) grupos['Hoy'].push(n);
    else if (f >= inicioSemana) grupos['Esta semana'].push(n);
    else if (f >= inicioMes) grupos['Este mes'].push(n);
    else grupos['Anterior'].push(n);
  }

  let html = '';
  for (const [titulo, lista] of Object.entries(grupos)) {
    if (lista.length === 0) continue;
    html += `<div class="grupo-fecha"><h4>${titulo}</h4>`;
    for (const notif of lista) {
      const foto = await getFotoUsuario(notif.usuario_origen);
      const tiempo = timeAgo(notif.fecha);
      let texto = '';
      switch (notif.tipo) {
        case 'like': texto = `<strong>${notif.usuario_origen}</strong> le gustó tu publicación.`; break;
        case 'comentario': texto = `<strong>${notif.usuario_origen}</strong> comentó: "${notif.texto || ''}"`; break;
        case 'solicitud_seguimiento': texto = `<strong>${notif.usuario_origen}</strong> solicitó seguirte.`; break;
        case 'seguir': texto = `<strong>${notif.usuario_origen}</strong> empezó a seguirte.`; break;
        default: texto = `<strong>${notif.usuario_origen}</strong> interactuó contigo.`;
      }
      const isUnread = notif.estado_pendiente !== false;
      html += `
        <div class="notificacion ${isUnread ? 'notif-unread' : ''}" data-id="${notif.id}" data-tipo="${notif.tipo}" data-origen="${notif.usuario_origen}" data-referencia="${notif.referencia_id || ''}">
          <img src="${foto}" alt="">
          <div class="contenido">
            <div class="texto">${texto}</div>
            <div class="tiempo">${tiempo}</div>
          </div>
          ${(notif.tipo === 'solicitud_seguimiento' && notif.estado_pendiente) ? `
          <div class="acciones">
            <button class="confirmar">Confirmar</button>
            <button class="btn-sec eliminar">Eliminar</button>
          </div>` : ''}
        </div>
      `;
    }
    html += `</div>`;
  }
  container.innerHTML = html;

  // Events
  document.querySelectorAll('.notificacion').forEach(div => {
    const id = div.dataset.id;
    const tipo = div.dataset.tipo;
    const origen = div.dataset.origen;

    div.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (tipo === 'like' || tipo === 'comentario') {
        // Navigate to post
        window.location.href = `home.html#post-${div.dataset.referencia}`;
      } else {
        window.location.href = `profile.html?user=${origen}`;
      }
      // Mark as read
      supabase.from('notificaciones').update({ estado_pendiente: false }).eq('id', id);
    });

    const confirmBtn = div.querySelector('.confirmar');
    const eliminarBtn = div.querySelector('.eliminar');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await supabase.from('seguidores').insert({ seguidor: origen, seguido: getCurrentUser(), estado: 'aprobado' });
        await supabase.from('notificaciones').update({ estado_pendiente: false }).eq('id', id);
        div.remove();
      });
    }
    if (eliminarBtn) {
      eliminarBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await supabase.from('notificaciones').delete().eq('id', id);
        div.remove();
      });
    }
  });
}

async function getFotoUsuario(username) {
  const { data } = await supabase.from('usuarios').select('foto').eq('username', username).maybeSingle();
  return data?.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);
}

async function init() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'index.html'; return; }

  // Set nav avatar
  const navAvatar = document.getElementById('navAvatar');
  const { data: me } = await supabase.from('usuarios').select('foto').eq('username', user).maybeSingle();
  if (navAvatar && me?.foto) navAvatar.src = me.foto;

  await cargarNotificaciones();

  document.getElementById('searchBtn')?.addEventListener('click', () => window.location.href = 'search.html');
  document.getElementById('createBtn')?.addEventListener('click', () => alert('Crear publicación'));
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) { localStorage.removeItem('usuario'); supabase.auth.signOut(); window.location.href = 'index.html'; }
  });

  // Refresh every 15s
  setInterval(cargarNotificaciones, 15000);
}

init();
