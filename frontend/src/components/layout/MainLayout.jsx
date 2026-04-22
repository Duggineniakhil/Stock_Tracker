import React from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
    return (
        <div className="site">
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 70px)' }}>
                {children}
            </main>
            
            <footer className="footer" style={{ marginTop: '4rem' }}>
                <div className="ft-bottom">
                    <div className="ft-copy">© 2025 Quotra. All rights reserved.</div>
                    <div className="ft-tagline">The Market, Simplified.</div>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
