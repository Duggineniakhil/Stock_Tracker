import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, (error) => Promise.reject(error));

// Handle 401 with automatic token refresh
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
    refreshQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    refreshQueue = [];
};

axiosInstance.interceptors.response.use((response) => response, async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            return Promise.reject(error);
        }
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                refreshQueue.push({ resolve, reject });
            }).then(token => { original.headers.Authorization = `Bearer ${token}`; return axiosInstance(original); })
                .catch(err => Promise.reject(err));
        }
        original._retry = true;
        isRefreshing = true;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });
            const { token } = res.data;
            localStorage.setItem('token', token);
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
            processQueue(null, token);
            original.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(original);
        } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
});

const api = {
    // Auth
    login: (email, password) => axios.post(`${API_BASE_URL}/api/v1/auth/login`, { email, password }).then(r => r.data),
    register: (email, password) => axios.post(`${API_BASE_URL}/api/v1/auth/register`, { email, password }).then(r => r.data),
    refreshToken: (refreshToken) => axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken }).then(r => r.data),
    logout: (refreshToken) => axios.post(`${API_BASE_URL}/api/v1/auth/logout`, { refreshToken }).then(r => r.data),

    // Watchlist
    fetchWatchlist: () => axiosInstance.get('/v1/watchlist').then(r => r.data),
    addToWatchlist: (symbol) => axiosInstance.post('/v1/watchlist', { symbol }).then(r => r.data),
    removeFromWatchlist: (id) => axiosInstance.delete(`/v1/watchlist/${id}`).then(r => r.data),

    // Stocks
    fetchStockData: (symbol) => axiosInstance.get(`/v1/stock/${symbol}`).then(r => r.data),
    fetchStockHistory: (symbol, range = '1mo') => axiosInstance.get(`/v1/stock/${symbol}/history`, { params: { range } }).then(r => r.data),

    // Alerts - History
    fetchAlerts: (limit = 50, offset = 0, symbol = null) => {
        const params = { limit, offset };
        if (symbol) params.symbol = symbol;
        return axiosInstance.get('/v1/alerts', { params }).then(r => r.data);
    },
    deleteAlert: (id) => axiosInstance.delete(`/v1/alerts/${id}`).then(r => r.data),
    clearAlertHistory: () => axiosInstance.delete('/v1/alerts/history/clear').then(r => r.data),
    createManualAlert: (data) => axiosInstance.post('/v1/alerts', data).then(r => r.data),

    // Alerts - Rules
    fetchAlertRules: (symbol = null) => {
        const params = {};
        if (symbol) params.symbol = symbol;
        return axiosInstance.get('/v1/alerts/rules', { params }).then(r => r.data);
    },
    createAlertRule: (data) => axiosInstance.post('/v1/alerts/rules', data).then(r => r.data),
    updateAlertRule: (id, updates) => axiosInstance.put(`/v1/alerts/rules/${id}`, updates).then(r => r.data),
    deleteAlertRule: (id) => axiosInstance.delete(`/v1/alerts/rules/${id}`).then(r => r.data),

    // Portfolio
    fetchPortfolio: () => axiosInstance.get('/v1/portfolio').then(r => r.data),
    fetchPortfolioSummary: () => axiosInstance.get('/v1/portfolio/summary').then(r => r.data),
    fetchPortfolioAllocation: () => axiosInstance.get('/v1/portfolio/allocation').then(r => r.data),
    fetchPortfolioHistory: (range = '1mo') => axiosInstance.get('/v1/portfolio/history', { params: { range } }).then(r => r.data),
    fetchPortfolioPerformance: (range = '1mo') => axiosInstance.get('/v1/portfolio/performance', { params: { range } }).then(r => r.data),
    addHolding: (symbol, quantity, buyPrice, buyDate) =>
        axiosInstance.post('/v1/portfolio', { symbol, quantity, buyPrice, buyDate }).then(r => r.data),
    updateHolding: (id, updates) => axiosInstance.put(`/v1/portfolio/${id}`, updates).then(r => r.data),
    deleteHolding: (id) => axiosInstance.delete(`/v1/portfolio/${id}`).then(r => r.data),
    exportPortfolioCSV: () => axiosInstance.get('/v1/portfolio/export/csv', { responseType: 'blob' }).then(r => r.data),
    fetchStockNews: (symbols) => axiosInstance.get('/v1/stock/news', { params: { symbols: symbols.join(',') } }).then(r => r.data),
};

// Named exports
export const apiLogin = api.login;
export const apiRegister = api.register;
export const apiLogout = api.logout;
export const fetchWatchlist = api.fetchWatchlist;
export const addToWatchlist = api.addToWatchlist;
export const removeFromWatchlist = api.removeFromWatchlist;
export const fetchStockData = api.fetchStockData;
export const fetchStockHistory = api.fetchStockHistory;
export const fetchAlerts = api.fetchAlerts;
export const deleteAlert = api.deleteAlert;
export const clearAlertHistory = api.clearAlertHistory;
export const createManualAlert = api.createManualAlert;
export const fetchAlertRules = api.fetchAlertRules;
export const createAlertRule = api.createAlertRule;
export const updateAlertRule = api.updateAlertRule;
export const deleteAlertRule = api.deleteAlertRule;
export const fetchPortfolio = api.fetchPortfolio;
export const fetchPortfolioSummary = api.fetchPortfolioSummary;
export const fetchPortfolioAllocation = api.fetchPortfolioAllocation;
export const fetchPortfolioHistory = api.fetchPortfolioHistory;
export const fetchPortfolioPerformance = api.fetchPortfolioPerformance;
export const addHolding = api.addHolding;
export const updateHolding = api.updateHolding;
export const deleteHolding = api.deleteHolding;
export const exportPortfolioCSV = api.exportPortfolioCSV;
export const fetchStockNews = api.fetchStockNews;

export default axiosInstance;
