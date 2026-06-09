// Simula API de reels falsos para demo. Reemplaza por tu fetch real si tienes backend.
const DUMMY_REELS = [
    {
        id: 1,
        username: "lucas_99",
        avatar: "https://i.pravatar.cc/48?img=8",
        video: "https://www.w3schools.com/html/mov_bbb.mp4",
        caption: "¡Hermoso paisaje en mis vacaciones! 🌅",
        audio: "Audio Original - lucas_99",
        likes: 12,
        liked: false,
        saved: false,
        comments: ["Hermoso!", "Wow, qué lindo lugar!"],
    },
    {
        id: 2,
        username: "marti_ig",
        avatar: "https://i.pravatar.cc/48?img=14",
        video: "https://www.w3schools.com/html/movie.mp4",
        caption: "Mejores amigos, mejores recuerdos 💙",
        audio: "Canción favorita",
        likes: 29,
        liked: true,
        saved: true,
        comments: ["Jajaja qué buena onda", "Eso sí es amistad"],
    }
];

// Obtén contenedor reels y quita loader
const container = document.getElementById("reels-container");
const loader = document.getElementById("reel-loader");

function renderReels(reels) {
    container.innerHTML = '';
    reels.forEach((reel, idx) => {
        const reelDiv = document.createElement("div");
        reelDiv.className = "reel";
        reelDiv.style.position = "relative";
        reelDiv.style.marginBottom = "60px";

        // Video
        const video = document.createElement("video");
        video.src = reel.video;
        video.controls = true;
        video.autoplay = idx === 0;
        video.loop = true;
        video.muted = true;
        video.style.width = "100%";
        video.style.maxHeight = "420px";
        video.style.borderRadius = "15px";

        // Info inferior
        const info = document.createElement("div");
        info.className = "reel-info-container";
        info.innerHTML = `
            <div style="display:flex;align-items:center;margin-bottom:7px;">
                <img class="reel-avatar" src="${reel.avatar}" style="width:32px;height:32px;border-radius:50%;margin-right:10px;">
                <span class="reel-username">${reel.username}</span>
            </div>
            <div class="reel-caption">${reel.caption}</div>
            <div class="reel-audio">${reel.audio}</div>
        `;

        // Acciones (like, save, comment, share)
        const actions = document.createElement("div");
        actions.className = "reel-actions";
        actions.style.top = "10px";
        actions.innerHTML = `
            <button class="reel-action-btn reel-like-btn" aria-label="Like" title="Me gusta">
                <span class="like-icon" style="font-size:1.36rem">${reel.liked ? "❤️" : "🤍"}</span>
            </button>
            <span class="reel-action-label reel-likes-count">${reel.likes}</span>
            <button class="reel-action-btn reel-save-btn" aria-label="Guardar" title="Guardar">
                <span class="save-icon" style="font-size:1.3rem">${reel.saved ? "🔖" : "📄"}</span>
            </button>
            <button class="reel-action-btn reel-comment-btn" aria-label="Comentar" title="Comentar">
                💬
            </button>
            <button class="reel-action-btn reel-share-btn" aria-label="Compartir" title="Compartir">
                📤
            </button>
        `;

        // Comentarios abajo
        const commentsCont = document.createElement("div");
        commentsCont.className = "reel-comments";
        commentsCont.style.margin = "8px 0 4px 0";
        reel.comments.forEach(c => {
            const comm = document.createElement("div");
            comm.innerText = c;
            comm.style.fontSize = "0.92rem";
            comm.style.color = "#ffe";
            comm.style.marginBottom = "2px";
            commentsCont.appendChild(comm);
        });

        // Caja añadir comentario
        const commentForm = document.createElement("form");
        commentForm.className = "reel-comment-form";
        commentForm.innerHTML = `
            <input type="text" class="reel-comment-input" placeholder="Agrega un comentario..." 
                   style="paddding:4px 8px;margin-right:6px;border-radius:10px;outline:none; border:1px #888 solid;">
            <button type="submit" class="reel-action-btn" style="font-size:1.03rem;">Enviar</button>
        `;

        // Funcionalidad interacción
        // LIKE
        actions.querySelector(".reel-like-btn").addEventListener("click", (e) => {
            reel.liked = !reel.liked;
            reel.likes += reel.liked ? 1 : -1;
            actions.querySelector(".like-icon").innerText = reel.liked ? "❤️" : "🤍";
            actions.querySelector(".reel-likes-count").innerText = reel.likes;
        });

        // SAVE
        actions.querySelector(".reel-save-btn").addEventListener("click", (e) => {
            reel.saved = !reel.saved;
            actions.querySelector(".save-icon").innerText = reel.saved ? "🔖" : "📄";
        });

        // COMENTAR
        actions.querySelector(".reel-comment-btn").addEventListener("click", (e) => {
            commentForm.querySelector(".reel-comment-input").focus();
        });

        // Compartir (solo copia URL al portapapeles en demo)
        actions.querySelector(".reel-share-btn").addEventListener("click", async (e) => {
            await navigator.clipboard.writeText(reel.video);
            actions.querySelector(".reel-share-btn").classList.add("shared");
            actions.querySelector(".reel-share-btn").innerText = "✅";
            setTimeout(() => {
                actions.querySelector(".reel-share-btn").innerText = "📤";
                actions.querySelector(".reel-share-btn").classList.remove("shared");
            }, 1200);
        });

        // Enviar comentario
        commentForm.addEventListener("submit", (ev) => {
            ev.preventDefault();
            const input = commentForm.querySelector(".reel-comment-input");
            if (input.value.trim()) {
                reel.comments.push(input.value.trim());
                // Mostrar instantáneamente abajo
                const comm = document.createElement("div");
                comm.innerText = input.value.trim();
                comm.style.fontSize = "0.92rem";
                comm.style.color = "#ffe";
                comm.style.marginBottom = "2px";
                commentsCont.appendChild(comm);
                input.value = "";
            }
        });

        reelDiv.appendChild(video);
        reelDiv.appendChild(info);
        reelDiv.appendChild(actions);
        reelDiv.appendChild(commentsCont);
        reelDiv.appendChild(commentForm);

        container.appendChild(reelDiv);
    });
}

function obtenerReels() {
    // Simulación: reemplaza este timeout & array por tu llamada fetch real
    loader && (loader.style.display = 'none');
    setTimeout(() => {
        renderReels(DUMMY_REELS);
    }, 700);
}

obtenerReels();