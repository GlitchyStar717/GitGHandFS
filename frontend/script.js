// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginFormElement = document.getElementById('loginFormElement');
const showLoginLink = document.getElementById('showLogin');
const registerForm = document.getElementById('registerForm');
const registerFormElement = document.getElementById('registerFormElement');
const dashboard = document.getElementById('dashboard');
const showRegisterLink = document.getElementById('showRegister');
const logoutBtn = document.getElementById('logoutBtn');
const refreshProfileBtn = document.getElementById('refreshProfile');

// Error message elements
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// User info elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userId = document.getElementById('userId');

// Utility Functions
class ApiService {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// UI Helper Functions
function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

function hideError(element) {
    element.classList.remove('show');
}

function setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function showView(viewToShow) {
    // Hide all views
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    dashboard.style.display = 'none';
    
    // Show selected view
    viewToShow.style.display = 'block';
    
    // Clear error messages
    hideError(loginError);
    hideError(registerError);
}

function updateUserInfo(user) {
    userName.textContent = user.name;
    userEmail.textContent = user.email;
    userId.textContent = user.id;
}

// Authentication Functions
async function login(email, password) {
    try {
        const response = await ApiService.post('/login', { email, password });
        
        // Store token
        localStorage.setItem('authToken', response.token);
        
        // Update UI
        updateUserInfo(response.user);
        showView(dashboard);
        
        return response;
    } catch (error) {
        throw error;
    }
}

async function register(name, email, password) {
    try {
        const response = await ApiService.post('/register', { name, email, password });
        
        // Store token
        localStorage.setItem('authToken', response.token);
        
        // Update UI
        updateUserInfo(response.user);
        showView(dashboard);
        
        return response;
    } catch (error) {
        throw error;
    }
}

async function logout() {
    // Clear token
    localStorage.removeItem('authToken');
    
    // Clear form data
    loginFormElement.reset();
    registerFormElement.reset();
    
    // Show login form
    showView(loginForm);
}

async function refreshProfile() {
    try {
        const response = await ApiService.get('/profile');
        updateUserInfo(response);
        
        // Show success feedback
        const refreshBtn = document.getElementById('refreshProfile');
        const originalText = refreshBtn.textContent;
        refreshBtn.textContent = 'Profile Updated!';
        refreshBtn.style.background = '#28a745';
        
        setTimeout(() => {
            refreshBtn.textContent = originalText;
            refreshBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Profile refresh failed:', error);
        // If token is invalid, logout user
        if (error.message.includes('Invalid') || error.message.includes('expired')) {
            logout();
        }
    }
}

// Event Listeners
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    hideError(loginError);
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        await login(email, password);
    } catch (error) {
        showError(loginError, error.message);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    hideError(registerError);
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        await register(name, email, password);
    } catch (error) {
        showError(registerError, error.message);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(registerForm);
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(loginForm);
});

logoutBtn.addEventListener('click', () => {
    logout();
});

refreshProfileBtn.addEventListener('click', async () => {
    const btn = refreshProfileBtn;
    setButtonLoading(btn, true);
    
    try {
        await refreshProfile();
    } catch (error) {
        console.error('Refresh failed:', error);
    } finally {
        setButtonLoading(btn, false);
    }
});

// Auto-login check on page load
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        try {
            // Verify token by fetching profile
            const response = await ApiService.get('/profile');
            updateUserInfo(response);
            showView(dashboard);
        } catch (error) {
            // Token is invalid, remove it and show login
            localStorage.removeItem('authToken');
            showView(loginForm);
        }
    } else {
        showView(loginForm);
    }
});

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Real-time validation
document.getElementById('loginEmail').addEventListener('blur', (e) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) {
        e.target.style.borderColor = '#dc3545';
    } else {
        e.target.style.borderColor = '#e1e1e1';
    }
});

document.getElementById('registerEmail').addEventListener('blur', (e) => {
    const email = e.target.value;
    if (email && !validateEmail(email)) {
        e.target.style.borderColor = '#dc3545';
    } else {
        e.target.style.borderColor = '#e1e1e1';
    }
});

document.getElementById('loginPassword').addEventListener('blur', (e) => {
    const password = e.target.value;
    if (password && !validatePassword(password)) {
        e.target.style.borderColor = '#dc3545';
    } else {
        e.target.style.borderColor = '#e1e1e1';
    }
});

document.getElementById('registerPassword').addEventListener('blur', (e) => {
    const password = e.target.value;
    if (password && !validatePassword(password)) {
        e.target.style.borderColor = '#dc3545';
    } else {
        e.target.style.borderColor = '#e1e1e1';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeForm = document.querySelector('form:not([style*="display: none"])');
        if (activeForm) {
            activeForm.querySelector('button[type="submit"]').click();
        }
    }
    
    // Escape to clear errors
    if (e.key === 'Escape') {
        hideError(loginError);
        hideError(registerError);
    }
});