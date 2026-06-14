(function () {
  'use strict';

  const form      = document.getElementById('loginForm');
  const btn       = document.getElementById('btn-login');
  const inputs    = form.querySelectorAll('[data-validate]');
  const toggleBtn = document.getElementById('togglePassword');
  const pwdInput  = document.getElementById('login-password');

  // ===== REGLAS DE VALIDACIÓN =====
  var rules = {
    email: function (val) {
      if (!val.trim()) return 'El nombre de usuario o correo es obligatorio.';
      return '';
    },
    password: function (val) {
      if (!val)        return 'La contraseña es obligatoria.';
      return '';
    }
  };

  // ===== MOSTRAR ERROR / ÉXITO =====
  function showError(input, msg) {
    var group = input.closest('.form-group');
    var errEl = group.querySelector('.error-msg');

    input.classList.remove('success');
    input.classList.add('error');
    errEl.textContent = msg;
    group.classList.add('shake');
    setTimeout(function () { group.classList.remove('shake'); }, 350);
  }

  function showSuccess(input) {
    var group = input.closest('.form-group');
    var errEl = group.querySelector('.error-msg');

    input.classList.remove('error');
    input.classList.add('success');
    errEl.textContent = '';
  }

  // ===== VALIDAR UN CAMPO =====
  function validateField(input) {
    var ruleName = input.getAttribute('data-validate');
    if (!ruleName || !rules[ruleName]) return true;

    var msg = rules[ruleName](input.value);

    if (msg) {
      showError(input, msg);
      return false;
    }
    showSuccess(input);
    return true;
  }

  // ===== VALIDAR TODO EL FORMULARIO =====
  function checkFormValidity() {
    var allValid = true;

    inputs.forEach(function (inp) {
      if (!validateField(inp)) allValid = false;
    });

    btn.disabled = !allValid;
    return allValid;
  }

  // ===== MOSTRAR / OCULTAR CONTRASEÑA =====
  toggleBtn.addEventListener('click', function () {
    var type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
    pwdInput.setAttribute('type', type);

    toggleBtn.querySelector('.eye-icon').innerHTML =
      type === 'password'
        ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
        : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  });

  // ===== EVENTOS EN TIEMPO REAL =====
  inputs.forEach(function (inp) {
    inp.addEventListener('input', function () {
      validateField(inp);
      checkFormValidity();
    });

    inp.addEventListener('blur', function () {
      validateField(inp);
      checkFormValidity();
    });
  });

  // ===== ENVÍO DEL FORMULARIO =====
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!checkFormValidity()) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Iniciando sesión…';

    setTimeout(function () {
      window.location.href = 'home.html';
    }, 1500);
  });

})();
