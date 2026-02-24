import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
    fetchPortfolio: vi.fn().mockResolvedValue([]),
    fetchPortfolioSummary: vi.fn().mockResolvedValue({
        totalHoldings: 0, totalInvestment: 0, totalCurrentValue: 0,
        totalProfitLoss: 0, totalProfitLossPercent: 0
    }),
    fetchPortfolioAllocation: vi.fn().mockResolvedValue([]),
    addHolding: vi.fn(),
    deleteHolding: vi.fn(),
    updateHolding: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, email: 'test@example.com' }, logout: vi.fn() }),
    AuthProvider: ({ children }) => children,
}));

vi.mock('../components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));

import DashboardSummary from '../components/DashboardSummary';

describe('DashboardSummary', () => {
    it('should render all metric cards', () => {
        const mockSummary = {
            totalHoldings: 3,
            totalInvestment: 10000,
            totalCurrentValue: 12000,
            totalProfitLoss: 2000,
            totalProfitLossPercent: 20
        };
        const mockWatchlist = [
            { id: 1, symbol: 'AAPL', changePercent: 2.5, currentPrice: 150 },
            { id: 2, symbol: 'TSLA', changePercent: -1.2, currentPrice: 200 },
        ];

        const { container } = render(
            <MemoryRouter>
                <DashboardSummary summary={mockSummary} watchlist={mockWatchlist} />
            </MemoryRouter>
        );

        expect(screen.getByText('Portfolio Value')).toBeDefined();
        expect(screen.getByText('Total P/L')).toBeDefined();
        expect(screen.getByText('Top Gainer')).toBeDefined();
        expect(screen.getByText('Watchlist')).toBeDefined();
    });

    it('should show dashes for null summary', () => {
        render(<MemoryRouter><DashboardSummary summary={null} watchlist={[]} /></MemoryRouter>);
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
    });
});
