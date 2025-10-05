import React, { useState, useEffect } from 'react';
import './CollisionRiskPanel.css';

const CollisionRiskPanel = ({ collisionService, onObjectSelect }) => {
    const [riskData, setRiskData] = useState(null);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [filter, setFilter] = useState('all'); // all, high, medium, low

    useEffect(() => {
        if (!collisionService) return;

        // Add callback for real-time updates
        const handleUpdate = (update) => {
            if (update.type === 'risk_assessment') {
                setRiskData(update.data);
            }
        };

        collisionService.addCallback(handleUpdate);

        // Load initial data
        const loadInitialData = async () => {
            const data = collisionService.getAllData();
            setRiskData(data.riskStatistics);
        };

        loadInitialData();

        return () => {
            collisionService.removeCallback(handleUpdate);
        };
    }, [collisionService]);

    const handleRiskSelect = (risk) => {
        setSelectedRisk(risk);
        if (onObjectSelect) {
            onObjectSelect(risk);
        }
    };

    const getRiskColor = (category) => {
        switch (category) {
            case 'High': return '#ff4444';
            case 'Medium': return '#ffaa00';
            case 'Low': return '#44ff44';
            default: return '#888888';
        }
    };

    const getRiskIcon = (category) => {
        switch (category) {
            case 'High': return '⚠️';
            case 'Medium': return '⚡';
            case 'Low': return '✅';
            default: return '❓';
        }
    };

    const filteredRisks = riskData?.riskAssessments?.filter(risk => 
        filter === 'all' || risk.prediction.riskCategory === filter
    ) || [];

    return (
        <div className={`collision-risk-panel ${isExpanded ? 'expanded' : ''}`}>
            <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
                <h3>Collision Risk Assessment</h3>
                <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            </div>

            {isExpanded && (
                <div className="panel-content">
                    {/* Risk Statistics */}
                    <div className="risk-statistics">
                        <div className="stat-item">
                            <span className="stat-label">Total Pairs:</span>
                            <span className="stat-value">{riskData?.total || 0}</span>
                        </div>
                        <div className="stat-item high-risk">
                            <span className="stat-label">High Risk:</span>
                            <span className="stat-value">{riskData?.high || 0}</span>
                        </div>
                        <div className="stat-item medium-risk">
                            <span className="stat-label">Medium Risk:</span>
                            <span className="stat-value">{riskData?.medium || 0}</span>
                        </div>
                        <div className="stat-item low-risk">
                            <span className="stat-label">Low Risk:</span>
                            <span className="stat-value">{riskData?.low || 0}</span>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="filter-controls">
                        <button 
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
                            onClick={() => setFilter('high')}
                        >
                            High Risk
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
                            onClick={() => setFilter('medium')}
                        >
                            Medium Risk
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
                            onClick={() => setFilter('low')}
                        >
                            Low Risk
                        </button>
                    </div>

                    {/* Risk List */}
                    <div className="risk-list">
                        {filteredRisks.map((risk, index) => (
                            <div 
                                key={index}
                                className={`risk-item ${selectedRisk === risk ? 'selected' : ''}`}
                                onClick={() => handleRiskSelect(risk)}
                                style={{ borderLeftColor: getRiskColor(risk.prediction.riskCategory) }}
                            >
                                <div className="risk-header">
                                    <span className="risk-icon">
                                        {getRiskIcon(risk.prediction.riskCategory)}
                                    </span>
                                    <span className="risk-category">
                                        {risk.prediction.riskCategory} Risk
                                    </span>
                                    <span className="risk-probability">
                                        {(risk.prediction.collisionProbability * 100).toFixed(4)}%
                                    </span>
                                </div>
                                <div className="risk-details">
                                    <div className="object-pair">
                                        <span className="object1">{risk.object1}</span>
                                        <span className="vs">vs</span>
                                        <span className="object2">{risk.object2}</span>
                                    </div>
                                    <div className="risk-metrics">
                                        <span>Confidence: {(risk.prediction.confidence * 100).toFixed(1)}%</span>
                                        <span>Min Distance: {risk.prediction.minimumDistance?.toFixed(0)} km</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredRisks.length === 0 && (
                        <div className="no-risks">
                            No risks found for the selected filter.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollisionRiskPanel;

