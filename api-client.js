// API Client for Broker Platform
// Configure this with your backend URL

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = {
  // Helper for API calls
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important for cookies/sessions
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    register(fullName, email, phone, password) {
      return apiClient.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, password }),
      });
    },

    login(email, password) {
      return apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    logout() {
      return apiClient.request('/auth/logout', {
        method: 'POST',
      });
    },

    me() {
      return apiClient.request('/auth/me');
    },
  },

  // Portfolio endpoints
  portfolio: {
    get(userId = null) {
      const endpoint = userId ? `/portfolio/${userId}` : '/portfolio';
      return apiClient.request(endpoint);
    },

    update(userId, portfolio) {
      return apiClient.request(`/portfolio/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(portfolio),
      });
    },

    updateAsset(userId, asset, quantity) {
      return apiClient.request(`/portfolio/${userId}/asset/${asset}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },
  },

  // Admin endpoints
  admin: {
    getUsers() {
      return apiClient.request('/admin/users');
    },

    getUser(userId) {
      return apiClient.request(`/admin/users/${userId}`);
    },

    updateUserStatus(userId, status) {
      return apiClient.request(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    deleteUser(userId) {
      return apiClient.request(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
    },

    updateUserPortfolio(userId, portfolio) {
      return apiClient.request(`/portfolio/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(portfolio),
      });
    },

    updateUserAsset(userId, asset, quantity) {
      return apiClient.request(`/portfolio/${userId}/asset/${asset}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      });
    },
  },
};

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiClient;
}
