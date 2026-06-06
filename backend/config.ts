import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback = ''): string => process.env[key] || fallback;

const NODE_ENV = (getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test');
const IS_PRODUCTION = NODE_ENV === 'production';
const PORT = Number(getEnv('PORT', '5000'));
const JWT_SECRET = getEnv('JWT_SECRET') || (NODE_ENV === 'test' ? 'test_jwt_secret' : '');
const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET') || `${JWT_SECRET}_refresh`;
const JWT_EXPIRES_IN = getEnv('JWT_EXPIRES_IN', '1h');
const JWT_REFRESH_EXPIRES_IN = getEnv('JWT_REFRESH_EXPIRES_IN', '7d');
const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
const AI_MODEL = getEnv('AI_MODEL', 'gpt-4o-mini');
const EMAIL_HOST = getEnv('EMAIL_HOST');
const EMAIL_PORT = Number(getEnv('EMAIL_PORT', '587'));
const EMAIL_SECURE = getEnv('EMAIL_SECURE', 'false') === 'true';
const EMAIL_USER = getEnv('EMAIL_USER');
const EMAIL_PASS = getEnv('EMAIL_PASS');
const EMAIL_FROM = getEnv('EMAIL_FROM', 'onboarding@resend.dev');
const RATE_LIMIT_WINDOW_MS = Number(getEnv('RATE_LIMIT_WINDOW_MS', '60000'));
const RATE_LIMIT_MAX = Number(getEnv('RATE_LIMIT_MAX', '100'));
const AUTH_RATE_LIMIT_MAX = Number(getEnv('AUTH_RATE_LIMIT_MAX', '10'));
const MAX_LOGIN_ATTEMPTS = Number(getEnv('MAX_LOGIN_ATTEMPTS', '5'));
const LOCKOUT_DURATION_MINUTES = Number(getEnv('LOCKOUT_DURATION_MINUTES', '15'));
const DEFAULT_CORS_ORIGINS = [
    'http://localhost:5173',
    'https://stock-tracker-1-sj4n.onrender.com',
    'https://stock-tracker-lime-nu.vercel.app'
];
const configuredCorsOrigins = getEnv('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
const CORS_ORIGINS = [...new Set([...DEFAULT_CORS_ORIGINS, ...configuredCorsOrigins])];

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in environment configuration.');
}

export const config = {
    NODE_ENV,
    IS_PRODUCTION,
    PORT,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN,
    OPENAI_API_KEY,
    AI_MODEL,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
    AUTH_RATE_LIMIT_MAX,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION_MINUTES,
    CORS_ORIGINS
};
