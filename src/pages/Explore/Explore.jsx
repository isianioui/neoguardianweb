import React from 'react';
import Orrery from '../../components/Orrery/Orrery';
import Navigation from '../../components/Navigation/Navigation';
import './Explore.css';

const Explore = () => {
    return (
        <div className="explore-page">
            <Navigation />
            <div className="page-header">
                <h1>Explore Space</h1>
                <p>Navigate through the solar system and discover celestial objects</p>
            </div>
            <Orrery />
        </div>
    );
};

export default Explore;
