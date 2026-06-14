// ==================== SUPABASE ====================
const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== USUARIO ACTUAL ====================
const usuarioActual = localStorage.getItem("usuario") || "juan";
let usuarioSeleccionado = null;

// ==================== ELEMENTOS HTML ====================
const listaChats = document.getElementById("listaChats");
const contenedorMensajes = document.getElementById("contenedorMensajes");
const headerChat = document.querySelector(".headerChat");
const enviarMensajeDiv = document.querySelector(".enviarMensaje");
const nombreUsuarioActual = document.getElementById("nombreUsuarioActual");
const nombreChat = document.getElementById("nombreChat");
const estadoUsuario = document.getElementById("estadoUsuario");
const fotoUsuario = document.getElementById("fotoUsuario");
const inputMensaje = document.getElementById("inputMensaje");
const btnEnviar = document.getElementById("btnEnviar");

// ==================== INICIALIZAR ====================
nombreUsuarioActual.innerText = usuarioActual;
headerChat.style.display = "none";
enviarMensajeDiv.style.display = "none";

// ==================== CARGAR CHATS ====================
async function cargarChats() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .neq("username", usuarioActual);
  if (error) {
    console.log(error);
    return;
  }
  listaChats.innerHTML = "";
  data.forEach(usuario => {
    const div = document.createElement("div");
    div.className = "chat";
    div.innerHTML = `
<img src="${usuario.foto}" alt="">
<div class="textoChat">
  <h4>${usuario.username}</h4>
  <p>${usuario.estado}</p>
</div>`;
    div.addEventListener("click", () => { seleccionarChat(usuario); });
    listaChats.appendChild(div);
  });
}

// ==================== SELECCIONAR CHAT ====================
function seleccionarChat(usuario) {
  usuarioSeleccionado = usuario;
  headerChat.style.display = "flex";
  enviarMensajeDiv.style.display = "flex";
  nombreChat.innerText = usuario.username;
  estadoUsuario.innerText = usuario.estado;
  if (usuario.foto) fotoUsuario.src = usuario.foto;
  const mensajeInicio = document.querySelector(".mensajeInicio");
  if (mensajeInicio) mensajeInicio.style.display = "none";
  cargarMensajes();
}

// ==================== CARGAR MENSAJES ====================
async function cargarMensajes() {
  if (usuarioSeleccionado == null) return;
  const { data, error } = await supabaseClient
    .from("mensajes")
    .select("*")
    .or(`and(emisor.eq.${usuarioActual},receptor.eq.${usuarioSeleccionado.username}),and(emisor.eq.${usuarioSeleccionado.username},receptor.eq.${usuarioActual})`)
    .order("fecha", { ascending: true });
  if (error) {
    console.log(error);
    return;
  }
  contenedorMensajes.innerHTML = "";
  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = (msg.emisor === usuarioActual) ? "yo" : "otro";
    div.innerText = msg.mensaje;
    contenedorMensajes.appendChild(div);
  });
  contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

// ==================== ENVIAR MENSAJE ====================
async function enviarMensaje() {
  if (usuarioSeleccionado == null) return;
  const texto = inputMensaje.value.trim();
  if (texto === "") return;
  const { error } = await supabaseClient
    .from("mensajes")
    .insert([{
      emisor: usuarioActual,
      receptor: usuarioSeleccionado.username,
      mensaje: texto,
      fecha: new Date()
    }]);
  if (error) {
    console.log(error);
    return;
  }
  inputMensaje.value = "";
  cargarMensajes();
}

// ==================== BOTÓN ====================
btnEnviar.addEventListener("click", enviarMensaje);

// ==================== ENTER ====================
inputMensaje.addEventListener("keypress", e => { if (e.key === "Enter") enviarMensaje(); });

// ==================== BUSCADOR ====================
document.getElementById("buscar").addEventListener("input", () => {
  const texto = document.getElementById("buscar").value.toLowerCase();
  const chats = document.querySelectorAll(".chat");
  chats.forEach(chat => {
    const nombre = chat.querySelector("h4").innerText.toLowerCase();
    chat.style.display = nombre.includes(texto) ? "flex" : "none";
  });
});

// ==================== ACTUALIZAR MENSAJES CADA 2 SEGUNDOS ====================
setInterval(() => {
  if (usuarioSeleccionado) cargarMensajes();
}, 2000);

// ==================== PROBAR CONEXIÓN ====================
async function probarConexion() {
  const { data, error } = await supabaseClient.from("usuarios").select("*");
  console.log("USUARIOS");
  console.log(data);
  console.log(error);
}
probarConexion();

// ==================== INICIAR ====================
cargarChats();