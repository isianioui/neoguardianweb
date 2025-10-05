import React, { useState, useEffect } from 'react';
import './AlertSystem.css';

const AlertSystem = ({ collisionService, onAlertClick }) => {
    const [alerts, setAlerts] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!collisionService) return;

        const handleUpdate = (update) => {
            if (update.type === 'risk_assessment') {
                processRiskUpdate(update.data);
            }
        };

        collisionService.addCallback(handleUpdate);

        return () => {
            collisionService.removeCallback(handleUpdate);
        };
    }, [collisionService]);

    const processRiskUpdate = (riskData) => {
        const newAlerts = [];
        
        // Check for high-risk pairs
        if (riskData.predictions) {
            riskData.predictions.forEach(prediction => {
                if (prediction.prediction.riskCategory === 'High') {
                    const alert = {
                        id: `alert_${Date.now()}_${Math.random()}`,
                        type: 'high_risk',
                        title: 'High Collision Risk Detected',
                        message: `${prediction.object1} vs ${prediction.object2}`,
                        details: {
                            probability: prediction.prediction.collisionProbability,
                            confidence: prediction.prediction.confidence,
                            minimumDistance: prediction.prediction.minimumDistance,
                            timeToClosestApproach: prediction.prediction.timeToClosestApproach
                        },
                        timestamp: new Date(),
                        isRead: false,
                        priority: 'high'
                    };
                    newAlerts.push(alert);
                }
            });
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev]);
            setUnreadCount(prev => prev + newAlerts.length);
            setIsVisible(true);
        }
    };

    const markAsRead = (alertId) => {
        setAlerts(prev => 
            prev.map(alert => 
                alert.id === alertId ? { ...alert, isRead: true } : alert
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setAlerts(prev => 
            prev.map(alert => ({ ...alert, isRead: true }))
        );
        setUnreadCount(0);
    };

    const clearAlert = (alertId) => {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    };

    const clearAllAlerts = () => {
        setAlerts([]);
        setUnreadCount(0);
    };

    const handleAlertClick = (alert) => {
        markAsRead(alert.id);
        if (onAlertClick) {
            onAlertClick(alert);
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'high_risk': return '🚨';
            case 'medium_risk': return '⚠️';
            case 'low_risk': return 'ℹ️';
            default: return '📢';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ff4444';
            case 'medium': return '#ffaa00';
            case 'low': return '#44ff44';
            default: return '#666666';
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="alert-system">
            {/* Alert Button */}
            <div 
                className={`alert-button ${unreadCount > 0 ? 'has-alerts' : ''}`}
                onClick={() => setIsVisible(!isVisible)}
            >
                <span className="alert-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="alert-badge">{unreadCount}</span>
                )}
            </div>

            {/* Alert Panel */}
            {isVisible && (
                <div className="alert-panel">
                    <div className="alert-header">
                        <h3>Collision Alerts</h3>
                        <div className="alert-controls">
                            {unreadCount > 0 && (
                                <button 
                                    className="mark-all-read-btn"
                                    onClick={markAllAsRead}
                                >
                                    Mark All Read
                                </button>
                            )}
                            <button 
                                className="clear-all-btn"
                                onClick={clearAllAlerts}
                            >
                                Clear All
                            </button>
                            <button 
                                className="close-btn"
                                onClick={() => setIsVisible(false)}
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    <div className="alert-list">
                        {alerts.length === 0 ? (
                            <div className="no-alerts">
                                No alerts at this time.
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div 
                                    key={alert.id}
                                    className={`alert-item ${alert.isRead ? 'read' : 'unread'}`}
                                    onClick={() => handleAlertClick(alert)}
                                    style={{ borderLeftColor: getPriorityColor(alert.priority) }}
                                >
                                    <div className="alert-content">
                                        <div className="alert-title">
                                            <span className="alert-type-icon">
                                                {getAlertIcon(alert.type)}
                                            </span>
                                            <span className="alert-title-text">
                                                {alert.title}
                                            </span>
                                            {!alert.isRead && (
                                                <span className="unread-indicator">●</span>
                                            )}
                                        </div>
                                        <div className="alert-message">
                                            {alert.message}
                                        </div>
                                        <div className="alert-details">
                                            <span>Probability: {(alert.details.probability * 100).toFixed(4)}%</span>
                                            <span>Confidence: {(alert.details.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="alert-timestamp">
                                            {formatTimestamp(alert.timestamp)}
                                        </div>
                                    </div>
                                    <button 
                                        className="clear-alert-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearAlert(alert.id);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertSystem;

