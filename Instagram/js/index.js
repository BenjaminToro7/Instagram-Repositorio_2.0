const SUPABASE_URL = 'https://kmtpdatdvkeocksijsya.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qmrn1HJZgV5OnD1Bc7e1Ng_JClOATIt';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginForm = document.getElementById('loginForm');
const errorDiv = document.getElementById('loginError');
const btnLogin = document.querySelector('.btn-primary');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputValue = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    btnLogin.disabled = true;
    btnLogin.textContent = 'Iniciando sesión...';
    errorDiv.innerText = '';

    try {
        let email = inputValue;

        // Si el input NO contiene '@', buscamos el email asociado al username
        if (!inputValue.includes('@')) {
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('email')
                .eq('username', inputValue)
                .maybeSingle();  // 🔧 Corregido: usa maybeSingle() en lugar de single()

            // Si no se encuentra el username o el email es nulo
            if (error || !data || !data.email) {
                throw new Error(`No se encontró un usuario con el nombre "${inputValue}"`);
            }
            email = data.email;
        }

        // Autenticar con Supabase Auth
        const { error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message);

        // Obtener o crear el perfil en la tabla 'usuarios'
        let { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('username')
            .eq('email', email)
            .maybeSingle();  // También usamos maybeSingle aquí por seguridad

        let username;
        if (userError || !userData) {
            // Si no existe en la tabla 'usuarios', lo creamos automáticamente
            username = email.split('@')[0];
            const fotoDefault = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
            const { error: insertError } = await supabaseClient
                .from('usuarios')
                .insert([{ username, email, foto: fotoDefault, estado: 'Usuario de Instagram' }]);
            if (insertError) console.error('Error al insertar usuario:', insertError);
        } else {
            username = userData.username;
        }

        // Guardar el username en localStorage y redirigir
        localStorage.setItem('usuario', username);
        window.location.href = 'home.html';
    } catch (err) {
        errorDiv.innerText = err.message;
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar sesión';
    }
});