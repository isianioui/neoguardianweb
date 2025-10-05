import React, { useState } from 'react';
import Orrery from '../../components/Orrery/Orrery';
import Navigation from '../../components/Navigation/Navigation';
import CollisionDemo from '../../components/CollisionDetection/CollisionDemo';
import './OrreryPage.css';

const OrreryPage = () => {
    const [showCollisionDemo, setShowCollisionDemo] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [timeHorizon, setTimeHorizon] = useState(30);
    const [riskThreshold, setRiskThreshold] = useState(-2.0);

    const handleCollisionToggle = (active) => {
        setShowCollisionDemo(active);
        
        // Dispatch event to notify Orrery component
        const event = new CustomEvent('collisionDetection:toggle', {
            detail: { active }
        });
        window.dispatchEvent(event);
    };

    const handleRiskThresholdChange = (threshold) => {
        setRiskThreshold(threshold);
        
        // Dispatch event to notify Orrery component
        const event = new CustomEvent('collisionDetection:riskThreshold', {
            detail: { threshold }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="orrery-page">
            <Navigation showCollisionDemo={showCollisionDemo} />
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 12h8"/>
                            <path d="M12 8v8"/>
                        </svg>
                    </div>
                    <h1>Solar System Orrery</h1>
                    <p>Interactive 3D visualization with advanced collision detection</p>
                    <div className="collision-controls">
                        <button 
                            className={`collision-toggle ${showCollisionDemo ? 'active' : ''}`}
                            onClick={() => handleCollisionToggle(!showCollisionDemo)}
                        >
                            <svg className="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4"/>
                                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                            </svg>
                            <span>{showCollisionDemo ? 'Hide' : 'Show'} Collision Detection</span>
                        </button>
                        
                        {/* Heatmap button - only show when collision detection is active */}
                        {showCollisionDemo && (
                            <button 
                                className={`heatmap-toggle ${showHeatmap ? 'active' : ''}`}
                                onClick={() => setShowHeatmap(!showHeatmap)}
                            >
                                <svg className="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3h18v18H3z"/>
                                    <path d="M9 9h6v6H9z"/>
                                </svg>
                                <span>{showHeatmap ? 'Hide' : 'Show'} Heatmap</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="orrery-container">
                <Orrery />
                
                {/* Collision Detection Demo */}
                {showCollisionDemo && (
                    <CollisionDemo 
                        showHeatmap={showHeatmap}
                        setShowHeatmap={setShowHeatmap}
                        timeHorizon={timeHorizon}
                        setTimeHorizon={setTimeHorizon}
                    />
                )}
            </div>

            {/* Time Horizon Control - Bottom Right */}
            {showCollisionDemo && (
                <div className="time-horizon-control">
                    <div className="control-group">
                        <label>Time Horizon (days):</label>
                        <input
                            type="range"
                            min="1"
                            max="365"
                            value={timeHorizon}
                            onChange={(e) => setTimeHorizon(parseInt(e.target.value, 10))}
                            className="time-slider"
                        />
                        <span className="time-value">{timeHorizon}</span>
                    </div>
                    
                
                </div>
            )}
        </div>
    );
};

export default OrreryPage;
