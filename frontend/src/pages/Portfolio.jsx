import React, { useState, useEffect } from 'react';
import {
    fetchPortfolio,
    fetchPortfolioSummary,
    fetchPortfolioAllocation,
    addHolding,
    deleteHolding
} from '../services/api';
import AddHoldingForm from '../components/AddHoldingForm';
import PortfolioSummary from '../components/PortfolioSummary';
import PortfolioList from '../components/PortfolioList';
import AllocationPieChart from '../components/AllocationPieChart';
import Navbar from '../components/Navbar';
import './Portfolio.css';

const Portfolio = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [summary, setSummary] = useState(null);
    const [allocation, setAllocation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingHolding, setAddingHolding] = useState(false);

    // Load portfolio data
    const loadPortfolioData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [portfolioData, summaryData, allocationData] = await Promise.all([
                fetchPortfolio(),
                fetchPortfolioSummary(),
                fetchPortfolioAllocation()
            ]);

            setPortfolio(portfolioData.data || []);
            setSummary(summaryData.data || {});
            setAllocation(allocationData.data || []);
        } catch (err) {
            console.error('Error loading portfolio:', err);
            setError(err.response?.data?.message || 'Failed to load portfolio data');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadPortfolioData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadPortfolioData, 30000);

        return () => clearInterval(interval);
    }, []);

    // Handle add holding
    const handleAddHolding = async (holdingData) => {
        try {
            setAddingHolding(true);
            setError(null);

            await addHolding(
                holdingData.symbol,
                holdingData.quantity,
                holdingData.buyPrice,
                holdingData.buyDate
            );

            // Reload portfolio data
            await loadPortfolioData();
        } catch (err) {
            console.error('Error adding holding:', err);
            setError(err.response?.data?.message || 'Failed to add holding');
        } finally {
            setAddingHolding(false);
        }
    };

    // Handle delete holding
    const handleDeleteHolding = async (id) => {
        try {
            setError(null);
            await deleteHolding(id);

            // Reload portfolio data
            await loadPortfolioData();
        } catch (err) {
            console.error('Error deleting holding:', err);
            setError(err.response?.data?.message || 'Failed to delete holding');
        }
    };

    return (
        <>
            <Navbar />
            <div className="portfolio-page">
                <div className="page-header">
                    <h1>Portfolio Management</h1>
                    <p>Track your investments and analyze performance</p>
                </div>

                {error && (
                    <div className="error-banner">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {/* Summary Cards */}
                <PortfolioSummary summary={summary} loading={loading} />

                {/* Charts Section */}
                <div className="charts-grid">
                    <div className="chart-card">
                        <AllocationPieChart allocation={allocation} loading={loading} />
                    </div>
                </div>

                {/* Add Holding Form */}
                <AddHoldingForm
                    onAdd={handleAddHolding}
                    loading={addingHolding}
                />

                {/* Holdings List */}
                <PortfolioList
                    holdings={portfolio}
                    onDelete={handleDeleteHolding}
                    loading={loading}
                />

                {/* Last updated indicator */}
                {!loading && (
                    <div className="last-updated">
                        Last updated: {new Date().toLocaleTimeString()}
                    </div>
                )}
            </div>
        </>
    );
};

export default Portfolio;
