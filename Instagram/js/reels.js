document.addEventListener("DOMContentLoaded", function() {

    // 1. Leer datos del usuario desde #userData
    const userDiv = document.getElementById("userData");
    function getUserData() {
        if (!userDiv) return {};
        const get = (key, def = "") => {
            let v = userDiv.dataset[key];
            if (typeof v === "undefined" || v === "") return def;
            return v;
        };
        return {
            name: get("name", "user"),
            age: parseInt(get("age", "0"), 10) || 0,
            bedtime: get("bedtime", "22:00"),
            character: get("character", "Shinchan"),
            color: get("color", "default"),
            hobby: get("hobby", "relax"),
            city: get("city", "your city")
        };
    }
    const user = getUserData();

    // 2. Función para generar tarjeta "Good Night"
    function generateGoodNightCard(user) {
        // Color gradientes (puedes ampliar aquí)
        let grad = "";
        switch ((user.color || "").toLowerCase()) {
            case "rosa":
            case "rose":
            case "pink":
                grad = "linear-gradient(120deg, #ffb6c1 0%, #8f5fe8 100%)";
                break;
            case "azul":
            case "blue":
                grad = "linear-gradient(120deg, #20386a 0%, #56d1fc 100%)";
                break;
            case "lila":
            case "violet":
            case "morado":
            case "purple":
                grad = "linear-gradient(120deg, #766bbf 0%, #f294ec 100%)";
                break;
            case "amarillo":
            case "yellow":
                grad = "linear-gradient(110deg, #ffe884 0%, #ffb762 100%)";
                break;
            case "verde":
            case "green":
                grad = "linear-gradient(110deg, #80d995 0%, #145c26 100%)";
                break;
            default:
                grad = "linear-gradient(120deg, #0B192C 0%, #23236a 100%)";
        }

        // Personaje favorito → emoji/símbolo
        const characterEmojis = {
            "Shinchan": "🟡🧒",
            "Himawari": "👧🌸",
            "Masao": "👦📘",
            "Nevado": "🐶❄️",
            "Bo": "🧑‍🦱🎨",
            "Nene": "👧🎀",
            "Kazama": "🧑‍💼🟦"
        };
        const charKey = Object.keys(characterEmojis)
            .find(k => k.toLowerCase() === (user.character || "").toLowerCase()) || "Shinchan";
        const charEmoji = characterEmojis[charKey];

        // Edad: frase
        let agePhrase = "Dream of funny adventures!";
        if (user.age >= 12 && user.age <= 18) {
            agePhrase = "Rest well for a great tomorrow.";
        } else if (user.age > 18) {
            agePhrase = "You did well today. Sleep peacefully.";
        }

        // Valores por defecto elegantes (ya normalizado arriba, pero por si acaso)
        const uName = user.name || "friend";
        const uBedtime = user.bedtime || "22:00";
        const uHobby = user.hobby || "relax";
        const uCity = user.city || "your city";

        // Crear div principal de la tarjeta
        const card = document.createElement("div");
        card.className = "goodnight-card";
        card.style.width = "100%";
        card.style.height = "100%";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.justifyContent = "flex-end";
        card.style.background = grad;
        card.style.position = "relative";
        card.style.boxSizing = "border-box";
        card.style.padding = "0 0 32px 0";

        // Emoji/ilustración arriba
        const charDiv = document.createElement("div");
        charDiv.className = "good-night-illustration";
        charDiv.style.marginBottom = "26px";
        charDiv.style.textAlign = "center";
        charDiv.style.fontSize = "72px";
        charDiv.style.lineHeight = "1";
        charDiv.textContent = charEmoji;

        // Bocadillo Shinchan says…
        const bubble = document.createElement("div");
        bubble.className = "good-night-bubble";
        bubble.style.background = "rgba(255,255,255,0.77)";
        bubble.style.color = "#191934";
        bubble.style.padding = "12px 28px";
        bubble.style.borderRadius = "21px 20px 29px 25px/19px 25px 32px 21px";
        bubble.style.fontSize = "1.05rem";
        bubble.style.marginBottom = "18px";
        bubble.style.maxWidth = "80%";
        bubble.style.textAlign = "center";
        bubble.style.boxShadow = "0 2px 14px #1a1a3a0c";

        bubble.innerHTML = `<span style="font-weight:600"> ${charKey} says…</span><br>
            Good Night, <span style="font-weight:bold">${uName}</span> ✨ <br>
            It's <b>${uBedtime}</b>, time to rest.<br>
            Don't forget to <b>${uHobby}</b> before sleeping.`;

        // Título/frase
        const title = document.createElement("div");
        title.className = "good-night-title";
        title.style.color = "#fff";
        title.style.fontSize = "2.1rem";
        title.style.fontWeight = "700";
        title.style.marginBottom = "14px";
        title.style.textAlign = "center";
        title.style.textShadow = "0 2px 20px #0b193c80, 0 0px 7px #26262633";
        title.style.letterSpacing = "0.01em";
        title.innerText = agePhrase;

        // Ciudad: "From [city] to dreamland"
        const cityDiv = document.createElement("div");
        cityDiv.style.marginTop = "9px";
        cityDiv.style.color = "#fff";
        cityDiv.style.fontSize = "1.02rem";
        cityDiv.style.opacity = "0.75";
        cityDiv.innerText = `From ${uCity} to dreamland`;

        // Firma
        const firma = document.createElement("div");
        firma.style.marginTop = "9px";
        firma.style.fontSize = "0.98rem";
        firma.style.color = "#b19dff";
        firma.style.opacity = "0.7";
        firma.style.textAlign = "center";
        firma.innerText = "thepawtraittites · digital art";

        // Agregar todo en orden
        card.appendChild(charDiv);
        card.appendChild(bubble);
        card.appendChild(title);
        card.appendChild(cityDiv);
        card.appendChild(firma);

        return card;
    }

    // 3. Control de modal
    const reelModal = document.querySelector(".reel-modal");
    const modalContent = document.querySelector(".modal-content");
    const closeBtn = document.querySelector(".modal-close-btn");
    const reelContent = document.getElementById("reelContent");

    function openReelModal() {
        if (!reelModal || !modalContent || !reelContent) return;
        reelModal.style.display = "flex";
        // Eliminar contenido anterior
        while (reelContent.firstChild) reelContent.removeChild(reelContent.firstChild);
        // Generar tarjeta y ponerla
        const card = generateGoodNightCard(user);
        reelContent.appendChild(card);
    }
    function closeReelModal() {
        if (!reelModal) return;
        reelModal.style.display = "none";
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", function(ev) {
            closeReelModal();
        });
    }

    if (reelModal && modalContent) {
        reelModal.addEventListener("click", function(ev){
            if (ev.target === reelModal) {
                closeReelModal();
            }
        });
        // Previene cierre al click en el modal-content real
        modalContent.addEventListener("click", function(ev) {
            ev.stopPropagation();
        });
    }

    // 4. Personalización del perfil
    function personalizeProfile() {
        // Foto: usa el emoji del personaje (o imagen local si quieres)
        const profileImg = document.querySelector(".profile-img");
        if (profileImg) {
            // Usamos emoji dentro de un círculo/fondo
            // Borrar src, reemplazar por emoji usando data-uri SVG
            const charKey = Object.keys(user ? {
                "Shinchan": "🟡🧒",
                "Himawari": "👧🌸",
                "Masao": "👦📘",
                "Nevado": "🐶❄️",
                "Bo": "🧑‍🦱🎨",
                "Nene": "👧🎀",
                "Kazama": "🧑‍💼🟦"
            } : {}).find(k => k.toLowerCase() === (user.character || "").toLowerCase()) || "Shinchan";
            const emoji = {
                "Shinchan": "🟡🧒",
                "Himawari": "👧🌸",
                "Masao": "👦📘",
                "Nevado": "🐶❄️",
                "Bo": "🧑‍🦱🎨",
                "Nene": "👧🎀",
                "Kazama": "🧑‍💼🟦"
            }[charKey];

            // Crear svg rápido con emoji
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150">
                <rect rx="75" fill="#fff" width="150" height="150"/>
                <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="73">${emoji}</text>
            </svg>`;
            profileImg.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
            profileImg.style.background = "#eaeaea";
        }

        // Nombre usuario
        const username = document.querySelector(".profile-username");
        if (username) {
            username.textContent = `@${user.name || "user"}_dreams`;
        }

        // Bio
        const profileBio = document.querySelector(".profile-bio");
        if (profileBio) {
            profileBio.textContent = `🌙 ${user.hobby || "relax"} • sleeps at ${user.bedtime || "22:00"} • from ${user.city || "your city"}`;
        }
    }
    personalizeProfile();

    // 5. Simular datos de reels miniatura
    function renderFakeReels() {
        const grid = document.querySelector(".reel-grid");
        if (!grid) return;
        // Borra miniaturas previas
        grid.innerHTML = "";
        // Genera 6 miniaturas falsas
        for (let i=0; i<6; ++i) {
            const thumb = document.createElement("div");
            thumb.className = "reel-thumbnail";
            thumb.tabIndex = 0;
            // Pic estandard + icono play
            const imgWrap = document.createElement("div");
            imgWrap.className = "reel-thumb-image";
            imgWrap.style.background = "#222";
            imgWrap.style.width = "100%";
            imgWrap.style.height = "100%";

            // Emoji thumbs alternas
            const em = document.createElement("span");
            em.style.fontSize = "2.6rem";
            em.style.display = "block";
            em.style.textAlign = "center";
            const emojis = ["💫", "🌃", "🌙", "🛌", "🧸", "🌌"];
            em.textContent = emojis[i % emojis.length];

            imgWrap.appendChild(em);

            // Icono play
            const playIcon = document.createElement("span");
            playIcon.className = "reel-play-icon";
            playIcon.innerHTML = "▶️";
            imgWrap.appendChild(playIcon);

            thumb.appendChild(imgWrap);

            // Al hacer clic/cualquier thumbnail -> modal
            thumb.addEventListener("click", function() {
                openReelModal();
            });
            thumb.addEventListener("keypress", function(e) {
                if (e.key === "Enter" || e.key === " ") openReelModal();
            });

            grid.appendChild(thumb);
        }
    }
    renderFakeReels();

    // 6. Eliminar comportamiento real de video (N/A, pues no se usan videos)

    // 9. Botones de like/etc.: versión simulada (si aparecen, solo log)
    // Asumiendo que si hay: poner listeners en reel-actions de la demo
    (function setupDummyActions() {
        function clickDummy(ev) {
            ev.preventDefault();
            console.log("Funcionalidad simulada");
        }
        document.querySelectorAll('.reel-action-btn').forEach(btn => {
            btn.onclick = clickDummy;
        });
    })();

}); // DOMContentLoaded fin