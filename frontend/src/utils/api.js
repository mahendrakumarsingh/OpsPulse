const API_BASE_URL = 'http://localhost:5000/api';

// Get default authorization headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Handle response errors
const handleResponse = async (response) => {
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Something went wrong');
  }
  return json;
};

export const api = {
  // Auth Operations
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },
    register: async (name, email, password, role) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Services Operations
  services: {
    getAll: async () => {
      const res = await fetch(`${API_BASE_URL}/services`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getMetrics: async (id) => {
      const res = await fetch(`${API_BASE_URL}/services/${id}/metrics`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (serviceData) => {
      const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(serviceData)
      });
      return handleResponse(res);
    },
    update: async (id, serviceData) => {
      const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(serviceData)
      });
      return handleResponse(res);
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Incidents Operations
  incidents: {
    getAll: async (filters = {}) => {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/incidents${queryParams ? `?${queryParams}` : ''}`;
      const res = await fetch(url, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_BASE_URL}/incidents/stats`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    trigger: async (incidentData) => {
      const res = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(incidentData)
      });
      return handleResponse(res);
    },
    acknowledge: async (id) => {
      const res = await fetch(`${API_BASE_URL}/incidents/${id}/acknowledge`, {
        method: 'PUT',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    resolve: async (id) => {
      const res = await fetch(`${API_BASE_URL}/incidents/${id}/resolve`, {
        method: 'PUT',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
