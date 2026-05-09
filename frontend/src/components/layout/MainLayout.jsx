import React from 'react';
import Navbar from './Navbar';
import AIChatBot from '../ai/AIChatBot';

const MainLayout = ({ children }) => {
    return (
        <div className="site">
            <Navbar />
            <main className="container" style={{ paddingBottom: 'var(--sp-64)' }}>
                <div className="reveal">
                    {children}
                </div>
            </main>
            <AIChatBot />
            <footer className="container" style={{ 
                padding: 'var(--sp-64) var(--sp-24)', 
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center'
            }}>
                <p className="small-text">© 2026 Quotra. Premium Stock Intelligence.</p>
            </footer>
        </div>
    );
};

export default MainLayout;
