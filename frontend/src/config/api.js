const API_BASE_URL = 'https://solace-hub.onrender.com/api';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${API_BASE_URL}/auth/login/`,
      LOGOUT: `${API_BASE_URL}/auth/logout/`,
      CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password/`,
    },
    USERS: `${API_BASE_URL}/auth/users/`,
    CREDENTIALS: `${API_BASE_URL}/auth/credentials/`,
    CREDENTIALS_UPDATE: `${API_BASE_URL}/auth/credentials/update/`,
    DONORS: `${API_BASE_URL}/donors/`,
    CHITS: `${API_BASE_URL}/chits/`,
    DEPLOYMENTS: `${API_BASE_URL}/deployments/`,
    HARDWARE: `${API_BASE_URL}/deployments/hardware/`,
    REPORTS: `${API_BASE_URL}/reports/`,
  },
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`,
  };
};

// Helper function to handle API calls with session expiry checking
export const fetchWithAuth = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    // Handle session expiry
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.error === 'Session expired' || data.message?.includes('session expired')) {
        // Clear auth data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    return response;
  } catch (error) {
    if (error.message === 'Session expired') {
      throw error;
    }
    throw error;
  }
};
