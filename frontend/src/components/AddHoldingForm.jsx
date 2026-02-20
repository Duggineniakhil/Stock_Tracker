import React, { useState } from 'react';
import './AddHoldingForm.css';

const AddHoldingForm = ({ onAdd, loading }) => {
    const [formData, setFormData] = useState({
        symbol: '',
        quantity: '',
        buyPrice: '',
        buyDate: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Symbol validation
        if (!formData.symbol) {
            newErrors.symbol = 'Symbol is required';
        } else if (!/^[A-Z]{1,5}$/.test(formData.symbol.toUpperCase())) {
            newErrors.symbol = 'Symbol must be 1-5 uppercase letters';
        }

        // Quantity validation
        if (!formData.quantity) {
            newErrors.quantity = 'Quantity is required';
        } else if (parseFloat(formData.quantity) <= 0) {
            newErrors.quantity = 'Quantity must be positive';
        }

        // Buy Price validation
        if (!formData.buyPrice) {
            newErrors.buyPrice = 'Buy price is required';
        } else if (parseFloat(formData.buyPrice) <= 0) {
            newErrors.buyPrice = 'Buy price must be positive';
        }

        // Buy Date validation
        if (!formData.buyDate) {
            newErrors.buyDate = 'Buy date is required';
        } else if (new Date(formData.buyDate) > new Date()) {
            newErrors.buyDate = 'Buy date cannot be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'symbol' ? value.toUpperCase() : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onAdd({
                symbol: formData.symbol.toUpperCase(),
                quantity: parseFloat(formData.quantity),
                buyPrice: parseFloat(formData.buyPrice),
                buyDate: formData.buyDate
            });

            // Reset form
            setFormData({
                symbol: '',
                quantity: '',
                buyPrice: '',
                buyDate: ''
            });
        }
    };

    return (
        <div className="add-holding-form">
            <h3>Add Holding</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="symbol">Stock Symbol *</label>
                        <input
                            type="text"
                            id="symbol"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleChange}
                            placeholder="AAPL"
                            maxLength={5}
                            disabled={loading}
                            className={errors.symbol ? 'error' : ''}
                        />
                        {errors.symbol && <span className="error-message">{errors.symbol}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity">Quantity *</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="10"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            className={errors.quantity ? 'error' : ''}
                        />
                        {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="buyPrice">Buy Price ($) *</label>
                        <input
                            type="number"
                            id="buyPrice"
                            name="buyPrice"
                            value={formData.buyPrice}
                            onChange={handleChange}
                            placeholder="150.00"
                            step="0.01"
                            min="0"
                            disabled={loading}
                            className={errors.buyPrice ? 'error' : ''}
                        />
                        {errors.buyPrice && <span className="error-message">{errors.buyPrice}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="buyDate">Buy Date *</label>
                        <input
                            type="date"
                            id="buyDate"
                            name="buyDate"
                            value={formData.buyDate}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            disabled={loading}
                            className={errors.buyDate ? 'error' : ''}
                        />
                        {errors.buyDate && <span className="error-message">{errors.buyDate}</span>}
                    </div>
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? 'Adding...' : 'Add to Portfolio'}
                </button>
            </form>
        </div>
    );
};

export default AddHoldingForm;
