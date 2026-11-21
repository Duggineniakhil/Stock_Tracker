import { describe, it, expect, vi, afterEach } from 'vitest';
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import axiosInstance, { SESSION_EXPIRED_EVENT } from '../services/api';

const reject = (config: InternalAxiosRequestConfig, status: number) =>
    Promise.reject(new AxiosError('Request failed', String(status), config, null, {
        status, statusText: '', headers: {}, config, data: {},
    }));

describe('session expiry', () => {
    const originalAdapter = axiosInstance.defaults.adapter;

    afterEach(() => {
        axiosInstance.defaults.adapter = originalAdapter;
        localStorage.clear();
    });

    it('clears the token and signals logout when a 401 cannot be refreshed', async () => {
        localStorage.setItem('token', 'token-from-another-backend');
        const urls: string[] = [];
        const adapter: AxiosAdapter = (config) => {
            urls.push(config.url ?? '');
            return reject(config, config.url?.includes('/auth/refresh') ? 400 : 401);
        };
        axiosInstance.defaults.adapter = adapter;
        const onExpired = vi.fn();
        window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

        await expect(axiosInstance.get('/v1/portfolio')).rejects.toBeTruthy();

        window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
        expect(urls).toEqual(['/v1/portfolio', '/v1/auth/refresh']);
        expect(onExpired).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('retries the request with the new token when refresh succeeds', async () => {
        localStorage.setItem('token', 'expired-token');
        const seen: string[] = [];
        const adapter: AxiosAdapter = (config) => {
            const auth = String(config.headers?.Authorization ?? '');
            seen.push(`${config.url} ${auth}`);
            if (config.url?.includes('/auth/refresh')) {
                return Promise.resolve({ data: { data: { token: 'fresh-token' } }, status: 200, statusText: 'OK', headers: {}, config });
            }
            if (auth === 'Bearer fresh-token') {
                return Promise.resolve({ data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config });
            }
            return reject(config, 401);
        };
        axiosInstance.defaults.adapter = adapter;

        const res = await axiosInstance.get('/v1/portfolio');

        expect(res.status).toBe(200);
        expect(seen.at(-1)).toBe('/v1/portfolio Bearer fresh-token');
        expect(localStorage.getItem('token')).toBe('fresh-token');
    });
});
