import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Handle 401 (Unauthorized) - Optional: redirect to login
axiosInstance.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        // window.location.href = '/login'; // Force redirect? Better to let AuthContext handle it.
    }
    return Promise.reject(error);
});

const api = {
    // Watchlist endpoints
    fetchWatchlist: async () => {
        const response = await axiosInstance.get('/watchlist');
        return response.data;
    },

    addToWatchlist: async (symbol) => {
        const response = await axiosInstance.post('/watchlist', { symbol });
        return response.data;
    },

    removeFromWatchlist: async (id) => {
        const response = await axiosInstance.delete(`/watchlist/${id}`);
        return response.data;
    },

    // Stock endpoints
    fetchStockData: async (symbol) => {
        const response = await axiosInstance.get(`/stock/${symbol}`);
        return response.data;
    },

    fetchStockHistory: async (symbol, range = '1mo') => {
        const response = await axiosInstance.get(`/stock/${symbol}/history`, {
            params: { range }
        });
        return response.data;
    },

    // Alert endpoints
    fetchAlerts: async (limit = 50, offset = 0) => {
        const response = await axiosInstance.get('/alerts', {
            params: { limit, offset }
        });
        return response.data;
    }
};

export const fetchWatchlist = api.fetchWatchlist;
export const addToWatchlist = api.addToWatchlist;
export const removeFromWatchlist = api.removeFromWatchlist;
export const fetchStockData = api.fetchStockData;
export const fetchStockHistory = api.fetchStockHistory;
export const fetchAlerts = api.fetchAlerts;

export default axiosInstance;
