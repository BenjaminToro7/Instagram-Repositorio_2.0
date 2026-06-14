document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        let input;
        if (targetId) {
            input = document.getElementById(targetId);
        } else {
            input = this.closest('.password-wrapper')?.querySelector('input');
        }
        if (!input) return;
        const icon = this.querySelector('i') || this.querySelector('.eye-icon');
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        } else {
            input.type = 'password';
            if (icon) {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        }
    });
});