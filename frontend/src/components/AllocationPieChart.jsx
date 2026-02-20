import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './AllocationPieChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const AllocationPieChart = ({ allocation, loading }) => {
    if (loading) {
        return (
            <div className="allocation-chart">
                <h3>Portfolio Allocation</h3>
                <div className="chart-container skeleton"></div>
            </div>
        );
    }

    if (!allocation || allocation.length === 0) {
        return (
            <div className="allocation-chart">
                <h3>Portfolio Allocation</h3>
                <div className="empty-chart">
                    <p>No holdings to display</p>
                </div>
            </div>
        );
    }

    // Generate colors for each stock
    const generateColors = (count) => {
        const colors = [
            '#667eea',
            '#764ba2',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a',
            '#fee140',
            '#30cfd0'
        ];

        return allocation.map((_, index) => colors[index % colors.length]);
    };

    const chartData = {
        labels: allocation.map(item => item.symbol),
        datasets: [
            {
                data: allocation.map(item => item.percentage),
                backgroundColor: generateColors(allocation.length),
                borderColor: '#1a1a1a',
                borderWidth: 2,
                hoverOffset: 10
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#ffffff',
                    padding: 15,
                    font: {
                        size: 12
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                return {
                                    text: `${label} (${value.toFixed(1)}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const item = allocation[context.dataIndex];
                        const amount = item.currentValue.toLocaleString();
                        return `${label}: ${value.toFixed(2)}% ($${amount})`;
                    }
                }
            }
        }
    };

    return (
        <div className="allocation-chart">
            <h3>Portfolio Allocation</h3>
            <div className="chart-container">
                <Pie data={chartData} options={options} />
            </div>
        </div>
    );
};

export default AllocationPieChart;
