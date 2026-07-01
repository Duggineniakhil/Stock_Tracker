import axios from 'axios';

interface RefreshQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface ApiResponse<T = any> {
  data: T;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshQueue: RefreshQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  refreshQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const original = error.config as Record<string, any>;
    const retryable =
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/v1/auth/refresh');

    if (retryable) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosInstance.post<ApiResponse>('/v1/auth/refresh');
        const token = res.data?.data?.token || (res.data as any)?.token;
        if (!token) {
          throw new Error('Refresh response did not include a token');
        }
        localStorage.setItem('token', token);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const api = {
  login: (email: string, password: string) => axiosInstance.post('/v1/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    axiosInstance.post('/v1/auth/register', { name, email, password }).then((r) => r.data),
  googleLogin: (data: unknown) => axiosInstance.post('/v1/auth/google', data).then((r) => r.data),
  refreshToken: () => axiosInstance.post('/v1/auth/refresh').then((r) => r.data),
  logout: () => axiosInstance.post('/v1/auth/logout').then((r) => r.data),
  updatePlan: (email: string, newPlan: string) => axiosInstance.post('/v1/auth/plan', { email, newPlan }).then((r) => r.data),
  updateProfile: (data: unknown) => axiosInstance.put('/v1/auth/profile', data).then((r) => r.data),
  changePassword: (data: unknown) => axiosInstance.put('/v1/auth/password', data).then((r) => r.data),
  fetchWatchlist: () => axiosInstance.get('/v1/watchlist').then((r) => r.data),
  addToWatchlist: (symbol: string) => axiosInstance.post('/v1/watchlist', { symbol }).then((r) => r.data),
  removeFromWatchlist: (id: number) => axiosInstance.delete(`/v1/watchlist/${id}`).then((r) => r.data),
  fetchStockData: (symbol: string) => axiosInstance.get(`/v1/stock/${symbol}`).then((r) => r.data),
  fetchStockHistory: (symbol: string, range = '1mo') =>
    axiosInstance.get(`/v1/stock/${symbol}/history`, { params: { range } }).then((r) => r.data),
  fetchTrending: () => axiosInstance.get('/v1/stock/trending').then((r) => r.data),
  fetchAlerts: (limit: number | { limit?: number; offset?: number; symbol?: string } = 50, offset = 0, symbol: string | null = null) => {
    if (typeof limit === 'object' && limit !== null) {
      const options = limit;
      limit = options.limit ?? 50;
      offset = options.offset ?? 0;
      symbol = options.symbol ?? null;
    }
    const params: Record<string, unknown> = { limit, offset };
    if (symbol) params.symbol = symbol;
    return axiosInstance.get('/v1/alerts', { params }).then((r) => r.data);
  },
  deleteAlert: (id: number) => axiosInstance.delete(`/v1/alerts/${id}`).then((r) => r.data),
  clearAlertHistory: () => axiosInstance.delete('/v1/alerts/history/clear').then((r) => r.data),
  markAlertAsRead: (id: number) => axiosInstance.put(`/v1/alerts/${id}/read`).then((r) => r.data),
  markAllAlertsAsRead: () => axiosInstance.put('/v1/alerts/read-all').then((r) => r.data),
  fetchUnreadAlertCount: () => axiosInstance.get('/v1/alerts/unread-count').then((r) => r.data),
  createManualAlert: (data: unknown) => axiosInstance.post('/v1/alerts', data).then((r) => r.data),
  fetchAlertRules: (symbol: string | null = null) => {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;
    return axiosInstance.get('/v1/alerts/rules', { params }).then((r) => r.data);
  },
  createAlertRule: (data: unknown) => axiosInstance.post('/v1/alerts/rules', data).then((r) => r.data),
  updateAlertRule: (id: number, updates: unknown) => axiosInstance.put(`/v1/alerts/rules/${id}`, updates).then((r) => r.data),
  deleteAlertRule: (id: number) => axiosInstance.delete(`/v1/alerts/rules/${id}`).then((r) => r.data),
  fetchPortfolio: () => axiosInstance.get('/v1/portfolio').then((r) => r.data),
  fetchPortfolioSummary: () => axiosInstance.get('/v1/portfolio/summary').then((r) => r.data),
  fetchPortfolioAllocation: () => axiosInstance.get('/v1/portfolio/allocation').then((r) => r.data),
  fetchPortfolioHistory: (range?: string) => axiosInstance.get('/v1/portfolio/history', { params: { range } }).then((r) => r.data),
  fetchPortfolioHealth: () => axiosInstance.get('/v1/portfolio/health').then((r) => r.data),
  fetchPortfolioSectors: () => axiosInstance.get('/v1/portfolio/sectors').then((r) => r.data),
  fetchPortfolioPerformance: (range = '1mo') => axiosInstance.get('/v1/portfolio/performance', { params: { range } }).then((r) => r.data),
  addHolding: (symbol: string, quantity: number, buyPrice: number, buyDate: string) =>
    axiosInstance.post('/v1/portfolio', { symbol, quantity, buyPrice, buyDate }).then((r) => r.data),
  updateHolding: (id: number, updates: unknown) => axiosInstance.put(`/v1/portfolio/${id}`, updates).then((r) => r.data),
  deleteHolding: (id: number) => axiosInstance.delete(`/v1/portfolio/${id}`).then((r) => r.data),
  exportPortfolioCSV: () => axiosInstance.get('/v1/portfolio/export/csv', { responseType: 'blob' }).then((r) => r.data),
  fetchStockNews: (symbols: string[]) =>
    axiosInstance.get('/v1/stock/news', { params: { symbols: symbols.join(',') } }).then((r) => r.data),
  chatWithAI: (message: string) => axiosInstance.post('/v1/ai/chat', { message }).then((r) => r.data),
  fetchChatHistory: () => axiosInstance.get('/v1/ai/chat/history').then((r) => r.data),
  fetchStockSentiment: (symbol: string) => axiosInstance.get(`/v1/ai/sentiment/${symbol}`).then((r) => r.data),
  generateAIReport: () => axiosInstance.post('/v1/ai/report/generate').then((r) => r.data),
  fetchLatestAIReport: () => axiosInstance.get('/v1/ai/report/latest').then((r) => r.data),
  fetchAdminStats: () => axiosInstance.get('/v1/admin/stats').then((r) => r.data),
  fetchRecentUsers: () => axiosInstance.get('/v1/admin/users/recent').then((r) => r.data),
};

export const apiLogin = api.login;
export const apiRegister = api.register;
export const googleLogin = api.googleLogin;
export const apiLogout = api.logout;
export const updatePlan = api.updatePlan;
export const updateProfile = api.updateProfile;
export const changePassword = api.changePassword;
export const fetchWatchlist = api.fetchWatchlist;
export const addToWatchlist = api.addToWatchlist;
export const removeFromWatchlist = api.removeFromWatchlist;
export const fetchStockData = api.fetchStockData;
export const fetchStockHistory = api.fetchStockHistory;
export const fetchTrending = api.fetchTrending;
export const fetchAlerts = api.fetchAlerts;
export const deleteAlert = api.deleteAlert;
export const clearAlertHistory = api.clearAlertHistory;
export const markAlertAsRead = api.markAlertAsRead;
export const markAllAlertsAsRead = api.markAllAlertsAsRead;
export const fetchUnreadAlertCount = api.fetchUnreadAlertCount;
export const createManualAlert = api.createManualAlert;
export const fetchAlertRules = api.fetchAlertRules;
export const createAlertRule = api.createAlertRule;
export const updateAlertRule = api.updateAlertRule;
export const deleteAlertRule = api.deleteAlertRule;
export const fetchPortfolio = api.fetchPortfolio;
export const fetchPortfolioSummary = api.fetchPortfolioSummary;
export const fetchPortfolioAllocation = api.fetchPortfolioAllocation;
export const fetchPortfolioHistory = api.fetchPortfolioHistory;
export const fetchPortfolioHealth = api.fetchPortfolioHealth;
export const fetchPortfolioSectors = api.fetchPortfolioSectors;
export const fetchPortfolioPerformance = api.fetchPortfolioPerformance;
export const addHolding = api.addHolding;
export const updateHolding = api.updateHolding;
export const deleteHolding = api.deleteHolding;
export const exportPortfolioCSV = api.exportPortfolioCSV;
export const fetchStockNews = api.fetchStockNews;
export const chatWithAI = api.chatWithAI;
export const fetchChatHistory = api.fetchChatHistory;
export const fetchStockSentiment = api.fetchStockSentiment;
export const generateAIReport = api.generateAIReport;
export const fetchLatestAIReport = api.fetchLatestAIReport;
export const fetchAdminStats = api.fetchAdminStats;
export const fetchRecentUsers = api.fetchRecentUsers;



export default axiosInstance;
