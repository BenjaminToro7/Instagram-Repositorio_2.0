document.getElementById('btn-logo').addEventListener('click', () => {
    location.reload();
});

function getLikeState(post) {
    const icon = post.querySelector('.like-btn i');
    return icon.classList.contains('fa-solid');
}

function setLike(post, liked) {
    const icon = post.querySelector('.like-btn i');
    const likesEl = post.querySelector('.post-likes');

    if (liked && !getLikeState(post)) {
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.style.color = '#ff3040';
        const current = parseInt(likesEl.textContent);
        likesEl.textContent = (current + 1) + ' likes';
    } else if (!liked && getLikeState(post)) {
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = '';
        const current = parseInt(likesEl.textContent);
        likesEl.textContent = (current - 1) + ' likes';
    }
}

function showHeartAnimation(post) {
    const overlay = post.querySelector('.post-heart-overlay');
    overlay.classList.remove('show');
    void overlay.offsetWidth;
    overlay.classList.add('show');
}

document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const post = btn.closest('.post');
        const wasLiked = getLikeState(post);
        setLike(post, !wasLiked);
    });
});

document.querySelectorAll('.post-image').forEach(img => {
    img.addEventListener('dblclick', () => {
        const post = img.closest('.post');
        if (!getLikeState(post)) {
            setLike(post, true);
        }
        showHeartAnimation(post);
    });
});
