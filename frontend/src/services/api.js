import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Add token to requests
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Handle 401 (Unauthorized) - Optional: redirect to login
axios.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        // window.location.href = '/login'; // Force redirect? Better to let AuthContext handle it.
    }
    return Promise.reject(error);
});

const api = {
    // Watchlist endpoints
    fetchWatchlist: async () => {
        const response = await axios.get(`${API_BASE_URL}/watchlist`);
        return response.data;
    },

    addToWatchlist: async (symbol) => {
        const response = await axios.post(`${API_BASE_URL}/watchlist`, { symbol });
        return response.data;
    },

    removeFromWatchlist: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/watchlist/${id}`);
        return response.data;
    },

    // Stock endpoints
    fetchStockData: async (symbol) => {
        const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
        return response.data;
    },

    fetchStockHistory: async (symbol, range = '1mo') => {
        const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/history`, {
            params: { range }
        });
        return response.data;
    },

    // Alert endpoints
    fetchAlerts: async (limit = 50, offset = 0) => {
        const response = await axios.get(`${API_BASE_URL}/alerts`, {
            params: { limit, offset }
        });
        return response.data;
    }
};

export default api;
