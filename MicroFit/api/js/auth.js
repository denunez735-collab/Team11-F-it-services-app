/**
 * MicroFit Coach - Authentication Module
 * Handles user authentication state and operations
 */

class MicroFitAuth {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.initializeAuthUI();
        this.setupAuthListeners();
    }

    /**
     * Get current user from localStorage
     */
    getCurrentUser() {
        try {
            const user = localStorage.getItem('microfit-currentUser');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.displayName || this.currentUser.email || 'User';
    }

    /**
     * Get user email
     */
    getUserEmail() {
        return this.currentUser?.email || null;
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('microfit-currentUser');
        localStorage.removeItem('microfit-lastLogin');
        this.currentUser = null;
        window.location.href = 'login.html';
    }

    /**
     * Initialize authentication UI elements
     */
    initializeAuthUI() {
        const navAuthContainer = document.getElementById('navAuthContainer');
        if (!navAuthContainer) return;

        navAuthContainer.innerHTML = '';

        if (this.isLoggedIn()) {
            // Show logout button and user info
            navAuthContainer.innerHTML = `
                <div class="auth-info">
                    <span class="user-name" title="${this.getUserEmail()}">
                        <i class="fas fa-user-circle"></i> ${this.getUserDisplayName()}
                    </span>
                    <button class="nav-link logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Sign Out
                    </button>
                </div>
            `;

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.logout();
                });
            }
        } else {
            // Show login and register buttons
            navAuthContainer.innerHTML = `
                <div class="auth-buttons">
                    <a href="login.html" class="nav-link login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </a>
                    <a href="register.html" class="nav-link register-btn">
                        <i class="fas fa-user-plus"></i> Sign Up
                    </a>
                </div>
            `;
        }
    }

    /**
     * Setup authentication event listeners
     */
    setupAuthListeners() {
        // Listen for storage changes (useful for multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'microfit-currentUser') {
                this.currentUser = this.getCurrentUser();
                this.initializeAuthUI();
            }
        });
    }

    /**
     * Format login time
     */
    getLastLoginTime() {
        const lastLogin = localStorage.getItem('microfit-lastLogin');
        if (!lastLogin) return null;
        const date = new Date(lastLogin);
        return date.toLocaleString();
    }

    /**
     * Get user session duration in minutes
     */
    getSessionDuration() {
        const lastLogin = localStorage.getItem('microfit-lastLogin');
        if (!lastLogin) return 0;
        const loginTime = new Date(lastLogin).getTime();
        const now = new Date().getTime();
        return Math.floor((now - loginTime) / (1000 * 60));
    }

    /**
     * Update user profile
     */
    updateUserProfile(displayName) {
        if (!this.currentUser) return false;
        
        this.currentUser.displayName = displayName;
        localStorage.setItem('microfit-currentUser', JSON.stringify(this.currentUser));
        this.initializeAuthUI();
        return true;
    }

    /**
     * Get all registered users (for admin purposes)
     */
    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem('microfit-users') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Delete account
     */
    deleteAccount(password) {
        if (!this.currentUser) return false;

        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.uid === this.currentUser.uid);
        
        if (userIndex === -1) return false;

        const user = users[userIndex];
        
        // Verify password (in production, never do this on client)
        if (user.password !== password) return false;

        // Remove user
        users.splice(userIndex, 1);
        localStorage.setItem('microfit-users', JSON.stringify(users));
        
        // Logout
        this.logout();
        return true;
    }
}

// Initialize on page load
let microFitAuth = null;

document.addEventListener('DOMContentLoaded', () => {
    microFitAuth = new MicroFitAuth();
});
