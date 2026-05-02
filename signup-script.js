/* =========================================
   TRADEFLEX SIGNUP PAGE  signup-script.js
   ========================================= */

async function handleSignup() {
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const termsAccepted = document.getElementById('terms').checked;
  const errorMsg = document.getElementById('errorMsg');

  // Reset error message
  errorMsg.style.display = 'none';
  errorMsg.textContent = '';

  // Validation
  if (!fullName || !email || !phone || !password) {
    errorMsg.textContent = ' Please fill in all fields';
    errorMsg.style.display = 'block';
    return;
  }

  if (!validateEmail(email)) {
    errorMsg.textContent = ' Please enter a valid email address';
    errorMsg.style.display = 'block';
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = ' Password must be at least 6 characters long';
    errorMsg.style.display = 'block';
    return;
  }

  if (!termsAccepted) {
    errorMsg.textContent = ' Please agree to the Terms & Conditions and Privacy Policy';
    errorMsg.style.display = 'block';
    return;
  }

  // Get existing users
  let users = JSON.parse(localStorage.getItem('tradeflexUsers') || '[]');

  // Check if user already exists
  if (users.some(user => user.email === email || user.phone === phone)) {
    errorMsg.textContent = ' An account with this email or phone number already exists';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, email, phone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    errorMsg.style.display = 'block';
    errorMsg.style.color = '#059669';
    errorMsg.style.background = 'rgba(5, 150, 105, .1)';
    errorMsg.style.borderColor = 'rgba(5, 150, 105, .2)';
    errorMsg.textContent = ' Account created successfully! Redirecting to login...';

    setTimeout(() => {
      window.location.href = 'sign-in.html';
    }, 1500);
  } catch (error) {
    errorMsg.style.display = 'block';
    errorMsg.style.color = '#dc2626';
    errorMsg.style.background = 'rgba(220, 38, 38, .1)';
    errorMsg.style.borderColor = 'rgba(220, 38, 38, .2)';
    errorMsg.textContent = ` ${error.message}`;
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateUserID() {
  return 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Allow Enter key to submit
const fullNameInput = document.getElementById('fullName');
const signupEmailInput = document.getElementById('signupEmail');
const signupPhoneInput = document.getElementById('signupPhone');
const signupPasswordInput = document.getElementById('signupPassword');

[fullNameInput, signupEmailInput, signupPhoneInput, signupPasswordInput].forEach(input => {
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSignup();
      }
    });
  }
});
