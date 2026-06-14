const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const registerForm = document.getElementById('registerForm');
const errorDiv = document.getElementById('registerError');
const btnRegistro = document.querySelector('.btn-primary');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;

    // 1. Validaciones en el cliente
    if (password !== confirm) {
        errorDiv.innerText = '❌ Las contraseñas no coinciden';
        return;
    }
    if (password.length < 6) {
        errorDiv.innerText = '❌ La contraseña debe tener al menos 6 caracteres';
        return;
    }
    if (username.length < 3) {
        errorDiv.innerText = '❌ El nombre de usuario debe tener al menos 3 caracteres';
        return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        errorDiv.innerText = '❌ Correo electrónico no válido';
        return;
    }

    btnRegistro.disabled = true;
    btnRegistro.textContent = 'Registrando...';
    errorDiv.innerText = '';

    try {
        // 2. Intentar crear el usuario en Supabase Auth
        const { data, error: signUpError } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: { username: username }
            }
        });

        // 3. Manejar específicamente los errores 400
        if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
                // Usuario ya existe. Ahora, intentamos iniciar sesión.
                const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (signInError) {
                    // Si no puede iniciar sesión, la contraseña es incorrecta o el email no está confirmado.
                    errorDiv.innerText = '⚠️ El email ya está registrado, pero la contraseña es incorrecta o no has confirmado tu cuenta.';
                    btnRegistro.disabled = false;
                    btnRegistro.textContent = 'Registrarse';
                    return;
                }
                // Si el login funciona, el usuario ya existe y ya está autenticado.
                console.log("Usuario existente, iniciando sesión.");
            } else if (signUpError.message.includes('Email not confirmed')) {
                errorDiv.innerText = '⚠️ El email ya está registrado pero no está confirmado. Revisa tu bandeja de entrada.';
                btnRegistro.disabled = false;
                btnRegistro.textContent = 'Registrarse';
                return;
            } else if (signUpError.message.includes('rate limit')) {
                errorDiv.innerText = '⏳ Demasiadas solicitudes. Por favor, espera unos minutos e intenta de nuevo.';
                btnRegistro.disabled = false;
                btnRegistro.textContent = 'Registrarse';
                return;
            } else {
                throw new Error(signUpError.message);
            }
        }

        // 4. Si llegamos aquí, tenemos un usuario autenticado (ya sea nuevo o existente).
        // Ahora, aseguramos que su perfil esté en la tabla 'usuarios'.
        const fotoDefault = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
        const { error: upsertError } = await supabaseClient
            .from('usuarios')
            .upsert([{ username, email, foto: fotoDefault, estado: 'Nuevo en Instagram' }], { onConflict: 'username' });
            
        if (upsertError) {
            console.error("Error guardando el perfil del usuario:", upsertError);
            errorDiv.innerText = '⚠️ Tu cuenta se creó, pero hubo un problema al guardar tu perfil. Puedes continuar.';
        }

        // 5. Guardamos el username en localStorage y redirigimos al inicio
        localStorage.setItem('usuario', username);
        window.location.href = 'home.html';

    } catch (err) {
        console.error(err);
        errorDiv.innerText = `❌ Error: ${err.message}`;
        btnRegistro.disabled = false;
        btnRegistro.textContent = 'Registrarse';
    }
});