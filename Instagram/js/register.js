(function () {
  'use strict';

  const form    = document.getElementById('registerForm');
  const btn     = document.getElementById('btn-register');
  const inputs  = form.querySelectorAll('[data-validate]');

  // ===== REGLAS DE VALIDACIÓN =====
  const rules = {
    nombre: function (val) {
      if (!val.trim())               return 'El nombre completo es obligatorio.';
      if (val.trim().length < 3)     return 'Debe tener al menos 3 caracteres.';
      return '';
    },
    username: function (val) {
      if (!val.trim())               return 'El nombre de usuario es obligatorio.';
      if (val.trim().length < 3)     return 'Debe tener al menos 3 caracteres.';
      return '';
    },
    email: function (val) {
      if (!val.trim())               return 'El correo electrónico es obligatorio.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()))
        return 'Ingresa un correo válido (ej. usuario@dominio.com).';
      return '';
    },
    password: function (val) {
      if (!val)                      return 'La contraseña es obligatoria.';
      if (val.length < 8)            return 'Mínimo 8 caracteres.';
      if (!/[A-Z]/.test(val))        return 'Debe contener al menos una mayúscula.';
      if (!/[a-z]/.test(val))        return 'Debe contener al menos una minúscula.';
      if (!/\d/.test(val))           return 'Debe contener al menos un número.';
      return '';
    },
    'confirm-password': function (val) {
      if (!val)                      return 'Confirma tu contraseña.';
      if (val !== document.getElementById('password').value)
        return 'Las contraseñas no coinciden.';
      return '';
    }
  };

  // ===== MOSTRAR ERROR / ÉXITO =====
  function showError(input, msg) {
    const group = input.closest('.form-group');
    const errEl = group.querySelector('.error-msg');

    input.classList.remove('success');
    input.classList.add('error');
    errEl.textContent = msg;
    group.classList.add('shake');
    setTimeout(function () { group.classList.remove('shake'); }, 350);
  }

  function showSuccess(input) {
    const group = input.closest('.form-group');
    const errEl = group.querySelector('.error-msg');

    input.classList.remove('error');
    input.classList.add('success');
    errEl.textContent = '';
  }

  // ===== VALIDAR UN CAMPO =====
  function validateField(input) {
    const ruleName = input.getAttribute('data-validate');
    if (!ruleName || !rules[ruleName]) return true;

    const msg = rules[ruleName](input.value);

    if (msg) {
      showError(input, msg);
      return false;
    }
    showSuccess(input);
    return true;
  }

  // ===== VALIDAR TODO EL FORMULARIO =====
  function checkFormValidity() {
    let allValid = true;

    inputs.forEach(function (inp) {
      if (!validateField(inp)) allValid = false;
    });

    btn.disabled = !allValid;
    return allValid;
  }

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
    btn.textContent = 'Registrando…';

    setTimeout(function () {
      alert('¡Registro exitoso! Bienvenido a Instagram.');
      window.location.href = 'index.html';
    }, 1200);
  });

})();
