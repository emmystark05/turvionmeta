/* =========================================
   TRADEFLEX LOGIN PAGE  script.js
   ========================================= */

// Hamburger Menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  // Close menu when clicking on a link
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });
}

// Slide carousel functionality
const dots = document.querySelectorAll('.dot');
const slides = document.querySelectorAll('.slide');

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const targetIndex = parseInt(dot.dataset.target);
    showSlide(targetIndex);
  });
});

function showSlide(index) {
  // Remove active class from all slides and dots
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));

  // Add active class to current slide and dot
  slides[index].classList.add('active');
  dots[index].classList.add('active');
}

// Auto-rotate slides every 8 seconds
let currentSlide = 0;
setInterval(() => {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}, 8000);

// Login handler
async function handleLogin() {
  const emailPhone = document.getElementById('emailPhone').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  // Reset error message
  errorMsg.style.display = 'none';
  errorMsg.textContent = '';

  if (!emailPhone || !password) {
    errorMsg.textContent = ' Please enter both email/phone and password';
    errorMsg.style.display = 'block';
    return;
  }

  // Get registered users from localStorage
  const users = JSON.parse(localStorage.getItem('tradeflexUsers') || '[]');
  const user = users.find(user => user.email === emailPhone || user.phone === emailPhone);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailPhone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.user?.isAdmin) {
      window.location.href = './admin.html';
    } else {
      window.location.href = './user.html';
    }
  } catch (error) {
    errorMsg.textContent = ` ${error.message}`;
    errorMsg.style.display = 'block';
  }
}

// Allow Enter key to submit
const emailPhoneInput = document.getElementById('emailPhone');
const passwordInput = document.getElementById('password');
if (emailPhoneInput) {
  emailPhoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });
}
if (passwordInput) {
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
}

// Initialize first slide as active
if (slides.length > 0) {
  showSlide(0);
}
