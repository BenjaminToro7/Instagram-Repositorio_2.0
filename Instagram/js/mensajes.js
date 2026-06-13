
// =======================
// VARIABLES
// =======================

const usuarioActual =

localStorage.getItem("usuario")

|| "juan";


let usuarioSeleccionado = null;




// =======================
// ELEMENTOS HTML
// =======================

const listaChats =

document.getElementById("listaChats");


const contenedorMensajes =

document.getElementById("contenedorMensajes");


const headerChat =

document.querySelector(".headerChat");


const enviarMensajeDiv =

document.querySelector(".enviarMensaje");


const nombreUsuarioActual =

document.getElementById(

"nombreUsuarioActual"

);


const nombreChat =

document.getElementById(

"nombreChat"

);


const estadoUsuario =

document.getElementById(

"estadoUsuario"

);


const fotoUsuario =

document.getElementById(

"fotoUsuario"

);


const inputMensaje =

document.getElementById(

"inputMensaje"

);


const btnEnviar =

document.getElementById(

"btnEnviar"

);




// =======================
// INICIALIZAR
// =======================

nombreUsuarioActual.innerText =

usuarioActual;



headerChat.style.display =

"none";



enviarMensajeDiv.style.display =

"none";






// =======================
// CARGAR CHATS
// =======================

async function cargarChats(){



const {

data,

error

}

=

await supabase

.from("usuarios")

.select("*")

.neq(

"username",

usuarioActual

);





if(error){

console.log(error);

return;

}





listaChats.innerHTML="";





data.forEach(usuario=>{



const div=

document.createElement(

"div"

);





div.className=

"chat";





div.innerHTML=`

<img

src="${usuario.foto}"

alt="">



<div class="textoChat">



<h4>

${usuario.username}

</h4>



<p>

${usuario.estado}

</p>



</div>

`;






div.addEventListener(

"click",

()=>{

seleccionarChat(

usuario

)

}

);






listaChats

.appendChild(

div

);



})



}







// =======================
// SELECCIONAR CHAT
// =======================

function seleccionarChat(usuario){



usuarioSeleccionado=

usuario;





headerChat.style.display=

"flex";





enviarMensajeDiv.style.display=

"flex";






nombreChat.innerText=

usuario.username;






estadoUsuario.innerText=

usuario.estado;






fotoUsuario.src=

usuario.foto;






cargarMensajes();



}








// =======================
// CARGAR MENSAJES
// =======================

async function cargarMensajes(){



if(

usuarioSeleccionado==null

){

return;

}






const {

data,

error

}

=

await supabase

.from(

"mensajes"

)

.select("*")

.or(

`and(

emisor.eq.${usuarioActual},

receptor.eq.${usuarioSeleccionado.username}

),

and(

emisor.eq.${usuarioSeleccionado.username},

receptor.eq.${usuarioActual}

)`

)

.order(

"fecha",

{

ascending:true

}

);







contenedorMensajes.innerHTML="";







data.forEach(

msg=>{



const div=

document

.createElement(

"div"

);






if(

msg.emisor===

usuarioActual

){

div.className=

"yo";

}

else{

div.className=

"otro";

}






div.innerText=

msg.mensaje;






contenedorMensajes

.appendChild(

div

);



});






contenedorMensajes

.scrollTop=

contenedorMensajes

.scrollHeight;



}









// =======================
// ENVIAR MENSAJE
// =======================

async function enviarMensaje(){



if(

usuarioSeleccionado==null

){

return;

}






const texto=

inputMensaje

.value

.trim();






if(

texto===""

){

return;

}








const {

error

}

=

await supabase

.from(

"mensajes"

)

.insert([


{

emisor:

usuarioActual,



receptor:

usuarioSeleccionado.username,



mensaje:

texto,



fecha:

new Date()

}

])







if(error){

console.log(error);

return;

}







inputMensaje.value="";







cargarMensajes();



}








// =======================
// BOTON
// =======================

btnEnviar

.addEventListener(

"click",

enviarMensaje

);







// =======================
// ENTER
// =======================

inputMensaje

.addEventListener(

"keypress",

e=>{



if(

e.key==="Enter"

){

enviarMensaje();

}



})









// =======================
// BUSCADOR
// =======================

document

.getElementById(

"buscar"

)

.addEventListener(

"input",

()=>{



const texto=

document

.getElementById(

"buscar"

)

.value

.toLowerCase();






const chats=

document

.querySelectorAll(

".chat"

);






chats.forEach(

chat=>{



const nombre=

chat

.querySelector(

"h4"

)

.innerText

.toLowerCase();






chat.style.display=

nombre.includes(

texto

)

?

"flex"

:

"none";



})



})









// =======================
// TIEMPO REAL
// =======================

supabase

.channel(

"mensajes"

)

.on(

"postgres_changes",

{

event:"INSERT",

schema:"public",

table:"mensajes"

},

payload=>{



if(

usuarioSeleccionado

){

cargarMensajes();

}



}

)

.subscribe();









// =======================
// PROBAR CONEXION
// =======================

async function probarConexion(){



const {

data,

error

}

=

await supabase

.from(

"usuarios"

)

.select("*");





console.log(

"USUARIOS"

);





console.log(

data

);





console.log(

error

);



}





probarConexion();








// =======================
// INICIAR
// =======================

cargarChats();

