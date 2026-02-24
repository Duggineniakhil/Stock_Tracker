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

// Mock ThemeContext so Navbar doesn't crash
vi.mock('../context/ThemeContext', () => ({
    ThemeProvider: ({ children }) => children,
    useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
    default: { Provider: ({ children }) => children },
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
        // Tabs contain emoji + text, use getByRole to be precise
        const buttons = screen.getAllByRole('button');
        const tabTexts = buttons.map(b => b.textContent);
        expect(tabTexts.some(t => t.includes('History'))).toBe(true);
        expect(tabTexts.some(t => t.includes('Rules'))).toBe(true);
    });

    it('should show empty state for history', async () => {
        renderAlertsPage();
        await waitFor(() => {
            expect(screen.getByText(/No alerts yet/i)).toBeDefined();
        });
    });

    it('should switch to rules tab on click', async () => {
        renderAlertsPage();
        // Find the Rules tab button specifically
        const buttons = screen.getAllByRole('button');
        const rulesTab = buttons.find(b => b.textContent.includes('Rules'));
        fireEvent.click(rulesTab);
        await waitFor(() => {
            expect(screen.getByText(/No alert rules yet/i)).toBeDefined();
        });
    });

    it('should show create form when + New Rule is clicked', async () => {
        renderAlertsPage();
        // Switch to rules tab first
        const buttons = screen.getAllByRole('button');
        const rulesTab = buttons.find(b => b.textContent.includes('Rules'));
        fireEvent.click(rulesTab);

        await waitFor(() => {
            expect(screen.getByText(/No alert rules yet/i)).toBeDefined();
        });

        const newRuleBtn = screen.getByText(/New Rule/i);
        fireEvent.click(newRuleBtn);
        expect(screen.getByText(/Create Alert Rule/i)).toBeDefined();
    });
});
