import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ showCollisionDemo = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isHomePage = location.pathname === '/';
    const isOrreryPage = location.pathname === '/explore' || location.pathname === '/orrery';

    if (isHomePage) {
        return null; // Don't show navigation on home page
    }

    return (
        <nav className="navigation">
            <div className="nav-title">
                {isOrreryPage && !showCollisionDemo ? 'Space Explorer' : isOrreryPage ? '' : 'NeoGuardian'}
            </div>
        </nav>
    );
};

export default Navigation;
