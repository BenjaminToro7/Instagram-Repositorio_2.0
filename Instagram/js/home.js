document.addEventListener('DOMContentLoaded', () => {

  // 1. Inicio click → recargar página como F5
  document.querySelector('a[href="home.html"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    location.reload();
  });

  function toggleLike(post) {
    const btn = post.querySelector('.like-btn');
    const icon = btn?.querySelector('i');
    if (!icon) return;
    const liked = icon.classList.contains('fa-solid');
    const likesEl = post.querySelector('.post-likes');
    let n = likesEl ? parseInt(likesEl.textContent) || 0 : 0;
    if (liked) {
      icon.className = 'fa-regular fa-heart';
      btn.classList.remove('liked');
      likesEl.textContent = Math.max(0, n - 1) + ' likes';
    } else {
      icon.className = 'fa-solid fa-heart';
      btn.classList.add('liked');
      likesEl.textContent = (n + 1) + ' likes';
    }
  }

  function showHeartOverlay(post) {
    const overlay = post.querySelector('.post-heart-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      void overlay.offsetWidth;
      overlay.classList.add('show');
      setTimeout(() => overlay.classList.remove('show'), 800);
    }
  }

  // 2. Like button → solo alterna like sin animación
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const post = btn.closest('.post');
      if (post) toggleLike(post);
    });
  });

  // 3. Doble click en imagen → like + corazón blanco mediano
  document.querySelectorAll('.post-image').forEach(img => {
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const post = img.closest('.post');
      if (post) {
        toggleLike(post);
        showHeartOverlay(post);
      }
    });
  });

});
