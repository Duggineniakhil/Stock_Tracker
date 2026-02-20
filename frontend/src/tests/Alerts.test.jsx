import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock API
vi.mock('../services/api', () => ({
    fetchAlerts: vi.fn().mockResolvedValue({ alerts: [], totalCount: 0 }),
    fetchAlertRules: vi.fn().mockResolvedValue({ rules: [], count: 0 }),
    createAlertRule: vi.fn().mockResolvedValue({ id: 1, symbol: 'AAPL' }),
    deleteAlertRule: vi.fn().mockResolvedValue({ deleted: true }),
    updateAlertRule: vi.fn().mockResolvedValue({ updated: true }),
    deleteAlert: vi.fn().mockResolvedValue({}),
    clearAlertHistory: vi.fn().mockResolvedValue({ deleted: 0 }),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, email: 'test@example.com' }, logout: vi.fn() }),
    AuthProvider: ({ children }) => children,
}));

vi.mock('../components/Navbar', () => ({ default: () => <nav data-testid="navbar" /> }));

import Alerts from '../pages/Alerts';

describe('Alerts Page', () => {
    const renderAlertsPage = () => render(
        <MemoryRouter><Alerts /></MemoryRouter>
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the alerts page with title', () => {
        renderAlertsPage();
        expect(screen.getByText(/Alert Center/i)).toBeDefined();
    });

    it('should show History and Rules tabs', () => {
        renderAlertsPage();
        expect(screen.getByText(/History/i)).toBeDefined();
        expect(screen.getByText(/Rules/i)).toBeDefined();
    });

    it('should show empty state for history', async () => {
        renderAlertsPage();
        await waitFor(() => {
            expect(screen.getByText(/No alerts yet/i)).toBeDefined();
        });
    });

    it('should switch to rules tab on click', async () => {
        renderAlertsPage();
        const rulesTab = screen.getAllByText(/Rules/i)[0];
        fireEvent.click(rulesTab);
        await waitFor(() => {
            expect(screen.getByText(/No alert rules yet/i)).toBeDefined();
        });
    });

    it('should show create form when + New Rule is clicked', async () => {
        renderAlertsPage();
        const rulesTab = screen.getAllByText(/Rules/i)[0];
        fireEvent.click(rulesTab);
        await waitFor(() => { });
        const newRuleBtn = screen.getByText(/New Rule/i);
        fireEvent.click(newRuleBtn);
        expect(screen.getByText(/Create Alert Rule/i)).toBeDefined();
    });
});
