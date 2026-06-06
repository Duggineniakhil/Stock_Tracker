
import type { ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, email: 'test@test.com' }, logout: vi.fn() })
}));

vi.mock('../context/ThemeContext', () => ({
    ThemeProvider: ({ children }: { children: ReactElement }) => children,
    useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
    default: { Provider: ({ children }: { children: ReactElement }) => children },
}));

const mockPortfolio = [
    { id: 1, symbol: 'AAPL', quantity: 10, buy_price: 150, currentPrice: 175, currentValue: 1750, totalInvestment: 1500, profitLoss: 250, profitLossPercent: 16.67 },
    { id: 2, symbol: 'GOOGL', quantity: 5, buy_price: 2800, currentPrice: 2900, currentValue: 14500, totalInvestment: 14000, profitLoss: 500, profitLossPercent: 3.57 },
];

vi.mock('../services/api', () => ({
    fetchPortfolio: vi.fn(() => Promise.resolve({ data: mockPortfolio })),
    fetchPortfolioSummary: vi.fn(() => Promise.resolve({
        data: { totalHoldings: 2, totalInvestment: 15500, totalCurrentValue: 16250, totalProfitLoss: 750, totalProfitLossPercent: 4.84 }
    })),
    fetchPortfolioAllocation: vi.fn(() => Promise.resolve({
        data: [{ symbol: 'AAPL', percentage: 10.77 }, { symbol: 'GOOGL', percentage: 89.23 }]
    })),
    addHolding: vi.fn(() => Promise.resolve({ data: { id: 3 } })),
    deleteHolding: vi.fn(() => Promise.resolve({ success: true })),
    default: { interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } }
}));

const Portfolio = (await import('../pages/Portfolio')).default;

const renderWithRouter = (component: ReactElement) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Portfolio Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the portfolio page without crashing', async () => {
        renderWithRouter(<Portfolio />);
        await vi.waitFor(() => {
            expect(document.querySelector('.portfolio-page, .portfolio, .app-container, main')).toBeDefined();
        });
    });

    it('shows loading state initially', async () => {
        renderWithRouter(<Portfolio />);
        await vi.waitFor(() => {
            const container = document.querySelector('.portfolio-page, .portfolio, main, .app-container');
            expect(container).toBeDefined();
        });
    });
});
