// ========================================
// MENU MOBILE
// ========================================
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active');
  nav.classList.toggle('open');
});

// Fechar menu ao clicar em um link
nav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('active');
    nav.classList.remove('open');
  });
});

// ========================================
// HEADER SCROLL
// ========================================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ========================================
// ANIMAÇÕES DE SCROLL
// ========================================
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      scrollObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  scrollObserver.observe(el);
});

// ========================================
// MÁSCARA DE WHATSAPP
// ========================================
const whatsappInput = document.getElementById('whatsapp');

whatsappInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');

  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 7) {
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  } else if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else if (value.length > 0) {
    value = `(${value}`;
  }

  e.target.value = value;
});

// ========================================
// ENVIO DO FORMULÁRIO
// ========================================
const leadForm = document.getElementById('leadForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  // Estado de loading
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  submitBtn.disabled = true;

  const data = {
    nome: document.getElementById('nome').value,
    whatsapp: document.getElementById('whatsapp').value,
    email: document.getElementById('email').value
  };

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao enviar');
    }

    // Sucesso
    leadForm.style.display = 'none';
    formSuccess.style.display = 'block';
  } catch (error) {
    alert(error.message || 'Erro ao enviar formulário. Tente novamente.');
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
  }
});
