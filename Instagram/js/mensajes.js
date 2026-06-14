const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const usuarioActual = localStorage.getItem('usuario') || null;
let usuarioSeleccionado = null;
let chatsCache = [];
let typingTimeout = null;

const listaChats = document.getElementById('listaChats');
const contenedorMensajes = document.getElementById('contenedorMensajes');
const headerChat = document.querySelector('.headerChat');
const enviarMensajeDiv = document.getElementById('enviarMensajeDiv');
const nombreUsuarioActual = document.getElementById('nombreUsuarioActual');
const nombreChat = document.getElementById('nombreChat');
const estadoUsuario = document.getElementById('estadoUsuario');
const fotoUsuario = document.getElementById('fotoUsuario');
const inputMensaje = document.getElementById('inputMensaje');
const btnEnviar = document.getElementById('btnEnviar');

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + ' M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil';
  return n.toString();
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff/86400)} d`;
  return d.toLocaleDateString();
}

// Check URL param
const params = new URLSearchParams(window.location.search);
const directUser = params.get('user');

async function init() {
  if (!usuarioActual) { window.location.href = 'index.html'; return; }
  nombreUsuarioActual.textContent = usuarioActual;
  headerChat.style.display = 'none';
  enviarMensajeDiv.style.display = 'none';

  // Set nav avatar
  const navAvatar = document.getElementById('navAvatar');
  const { data: me } = await supabase.from('usuarios').select('foto').eq('username', usuarioActual).maybeSingle();
  if (navAvatar && me?.foto) navAvatar.src = me.foto;

  await cargarChats();

  if (directUser) {
    const { data } = await supabase.from('usuarios').select('*').eq('username', directUser).maybeSingle();
    if (data) seleccionarChat(data);
  }

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', () => window.location.href = 'search.html');
  document.getElementById('createBtn')?.addEventListener('click', () => alert('Crear publicación'));
  document.getElementById('moreBtn')?.addEventListener('click', () => {
    if (confirm('Cerrar sesión?')) { localStorage.removeItem('usuario'); supabase.auth.signOut(); window.location.href = 'index.html'; }
  });
}

async function cargarChats() {
  // Get all users the current user has exchanged messages with
  const { data: sent } = await supabase.from('mensajes').select('receptor').eq('emisor', usuarioActual);
  const { data: received } = await supabase.from('mensajes').select('emisor').eq('receptor', usuarioActual);
  const chatUsernames = new Set();
  (sent || []).forEach(m => chatUsernames.add(m.receptor));
  (received || []).forEach(m => chatUsernames.add(m.emisor));

  listaChats.innerHTML = '';

  if (chatUsernames.size === 0) {
    // Show all users as suggestions
    const { data: all } = await supabase.from('usuarios').select('*').neq('username', usuarioActual).limit(20);
    if (all) {
      all.forEach(u => renderChatItem(u, null, 0));
    }
    return;
  }

  for (const username of chatUsernames) {
    const { data: user } = await supabase.from('usuarios').select('*').eq('username', username).maybeSingle();
    if (!user) continue;
    // Get last message
    const { data: msgs } = await supabase.from('mensajes')
      .select('*')
      .or(`and(emisor.eq.${usuarioActual},receptor.eq.${username}),and(emisor.eq.${username},receptor.eq.${usuarioActual})`)
      .order('fecha', { ascending: false })
      .limit(1);
    const lastMsg = msgs?.[0] || null;
    const { count: unread } = await supabase.from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('emisor', username)
      .eq('receptor', usuarioActual)
      .eq('leido', false);
    renderChatItem(user, lastMsg, unread || 0);
  }
}

function renderChatItem(user, lastMsg, unread) {
  const div = document.createElement('div');
  div.className = 'chat';
  div.innerHTML = `
    <img src="${user.foto || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random()*70)}" alt="">
    <div class="textoChat">
      <h4>${user.username}</h4>
      <div class="last-msg">${lastMsg ? lastMsg.mensaje : (user.estado || 'Usuario de Instagram')}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
      ${lastMsg ? `<span class="msg-time">${timeAgo(lastMsg.fecha)}</span>` : ''}
      ${unread > 0 ? `<span class="unread-badge">${formatNum(unread)}</span>` : ''}
    </div>
  `;
  div.addEventListener('click', () => seleccionarChat(user));
  listaChats.appendChild(div);
}

function seleccionarChat(user) {
  usuarioSeleccionado = user;
  headerChat.style.display = 'flex';
  enviarMensajeDiv.style.display = 'flex';
  nombreChat.textContent = user.username;
  estadoUsuario.textContent = '🟢 Activo ahora';
  estadoUsuario.style.color = '#a8a8a8';
  if (user.foto) fotoUsuario.src = user.foto;
  const mensajeInicio = document.querySelector('.mensajeInicio');
  if (mensajeInicio) mensajeInicio.style.display = 'none';
  cargarMensajes();
}

async function cargarMensajes() {
  if (!usuarioSeleccionado) return;
  const { data, error } = await supabase.from('mensajes')
    .select('*')
    .or(`and(emisor.eq.${usuarioActual},receptor.eq.${usuarioSeleccionado.username}),and(emisor.eq.${usuarioSeleccionado.username},receptor.eq.${usuarioActual})`)
    .order('fecha', { ascending: true });
  if (error) return;
  contenedorMensajes.innerHTML = '';
  data.forEach(msg => {
    const isMine = msg.emisor === usuarioActual;
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isMine ? 'sent' : 'received'}`;
    wrapper.innerHTML = `
      <div class="msg-bubble">${msg.mensaje}</div>
      <div class="msg-time-small">
        ${timeAgo(msg.fecha)}
        ${isMine ? (msg.leido ? '<span class="msg-seen"><i class="fa-solid fa-check-double"></i></span>' : '<span class="msg-sent-icon"><i class="fa-solid fa-check"></i></span>') : ''}
      </div>
    `;
    contenedorMensajes.appendChild(wrapper);
  });
  contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;

  // Mark messages as read
  await supabase.from('mensajes')
    .update({ leido: true })
    .eq('emisor', usuarioSeleccionado.username)
    .eq('receptor', usuarioActual)
    .eq('leido', false);
}

async function enviarMensaje() {
  if (!usuarioSeleccionado) return;
  const texto = inputMensaje.value.trim();
  if (!texto) return;
  const { error } = await supabase.from('mensajes').insert([{
    emisor: usuarioActual,
    receptor: usuarioSeleccionado.username,
    mensaje: texto,
    fecha: new Date(),
    leido: false
  }]);
  if (error) { console.error(error); return; }
  inputMensaje.value = '';
  cargarMensajes();
  // Update chat list order
  cargarChats();
}

function showTyping() {
  if (!usuarioSeleccionado) return;
  estadoUsuario.textContent = '✍️ Escribiendo...';
  estadoUsuario.style.color = '#0095f6';
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    estadoUsuario.textContent = '🟢 Activo ahora';
    estadoUsuario.style.color = '#a8a8a8';
  }, 2000);
}

btnEnviar.addEventListener('click', enviarMensaje);
inputMensaje.addEventListener('keypress', e => {
  if (e.key === 'Enter') enviarMensaje();
  showTyping();
});

// Search chats
document.getElementById('buscar').addEventListener('input', () => {
  const text = document.getElementById('buscar').value.toLowerCase();
  const chats = document.querySelectorAll('.chat');
  chats.forEach(chat => {
    const name = chat.querySelector('h4').innerText.toLowerCase();
    chat.style.display = name.includes(text) ? 'flex' : 'none';
  });
});

// Real-time polling
setInterval(() => {
  if (usuarioSeleccionado) cargarMensajes();
  cargarChats();
}, 3000);

init();
