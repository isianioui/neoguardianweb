import React, { useState, useEffect, useRef } from 'react';
import './CollisionDemo.css';
import { addNotification, subscribeToNotifications, markNotificationAsRead, deleteNotification, clearAllNotifications, notificationsRef as firebaseNotificationsRef } from '../../utils/notificationService';
import { addTestNotification } from '../../utils/testFirebase';

const CollisionDemo = ({ showHeatmap, setShowHeatmap, timeHorizon, setTimeHorizon }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [showPredictions, setShowPredictions] = useState(true);
    const [neoNames, setNeoNames] = useState({});
    const [satelliteNames, setSatelliteNames] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef([]);
    
    // Subscribe to notifications from Firebase
    useEffect(() => {
        const unsubscribe = subscribeToNotifications((notificationsList) => {
            setNotifications(notificationsList);
        });
        
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Load real NEO names from risk_list_neo_data.json
    useEffect(() => {
        const loadNeoNames = async () => {
            try {
                const response = await fetch('/assets/data/risk_list_neo_data.json');
                if (!response.ok) throw new Error('Failed to load NEO data');
                const data = await response.json();
                setNeoNames(data);
            } catch (error) {
                console.warn('Could not load NEO data:', error);
            }
        };
        
        loadNeoNames();
    }, []);

    // Load real satellite names
    useEffect(() => {
        const loadSatelliteNames = async () => {
            try {
                // Real satellite names
                const realSatellites = [
                    'International Space Station',
                    'Hubble Space Telescope',
                    'GPS IIF-10',
                    'Landsat 9',
                    'GOES-16',
                    'Sentinel-2',
                    'Terra',
                    'Aqua',
                    'NOAA-20',
                    'Tiangong Space Station',
                    'Starlink-1234',
                    'OneWeb-0789',
                    'Galileo FOC-23',
                    'TDRS-M',
                    'JPSS-2'
                ];
                setSatelliteNames(realSatellites);
            } catch (error) {
                console.warn('Could not load satellite data:', error);
            }
        };
        
        loadSatelliteNames();
    }, []);

    useEffect(() => {
        const event = new CustomEvent('collisionDemo:togglePredictions', {
            detail: { show: showPredictions, timeHorizon }
        });
        window.dispatchEvent(event);
    }, [showPredictions, timeHorizon]);

    useEffect(() => {
        const event = new CustomEvent('collisionDemo:toggleHeatmap', {
            detail: { show: showHeatmap }
        });
        window.dispatchEvent(event);
    }, [showHeatmap]);
    
    const [mockData, setMockData] = useState({
        totalPairs: 0,
        high: 0,
        medium: 0,
        low: 0,
        riskAssessments: []
    });

    // Get a random real NEO name from the loaded data
    const getRandomRealNeoName = () => {
        if (Object.keys(neoNames).length === 0) {
            return `NEO-${Math.floor(Math.random() * 1000)}`;
        }
        
        const neoNamesList = Object.keys(neoNames);
        const randomIndex = Math.floor(Math.random() * neoNamesList.length);
        return neoNamesList[randomIndex];
    };

    // Get a random real satellite name
    const getRandomRealSatelliteName = () => {
        if (satelliteNames.length === 0) {
            return `SAT-${Math.floor(Math.random() * 100)}`;
        }
        
        const randomIndex = Math.floor(Math.random() * satelliteNames.length);
        return satelliteNames[randomIndex];
    };

    // Load saved notifications from localStorage
    useEffect(() => {
        const savedNotifications = localStorage.getItem('collisionNotifications');
        if (savedNotifications) {
            const parsedNotifications = JSON.parse(savedNotifications);
            setNotifications(parsedNotifications);
            notificationsRef.current = parsedNotifications;
        }
    }, []);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('collisionNotifications', JSON.stringify(notifications));
        notificationsRef.current = notifications;
    }, [notifications]);

    // Function to add a new notification
    const createNotification = async (risk) => {
        // Get the nearest planet to the collision
        const nearestPlanet = getNearestPlanet(risk.prediction.minimumDistance);
        
        const newNotification = {
            timestamp: new Date().toISOString(),
            risk: risk,
            read: false,
            nearestPlanet: nearestPlanet,
            distanceFromEarth: Math.floor(Math.random() * 1000000) + 10000, // Mock distance from Earth in km
        };
        
        // Save to Firebase (will be automatically synced to all devices)
        await addNotification(newNotification);
    };

    // Mock function to determine the nearest planet to a collision
    const getNearestPlanet = (distance) => {
        const planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
        return planets[Math.floor(Math.random() * planets.length)];
    };

    // Generate mock data with real NEO and satellite names
    useEffect(() => {
        const generateMockData = () => {
            const assessments = [];
            const totalPairs = Math.floor(Math.random() * 50) + 10;
            
            for (let i = 0; i < totalPairs; i++) {
                const probability = Math.random();
                let riskCategory = 'Low';
                if (probability > 0.1) riskCategory = 'High';
                else if (probability > 0.01) riskCategory = 'Medium';

                assessments.push({
                    object1: getRandomRealNeoName(),
                    object2: getRandomRealSatelliteName(),
                    prediction: {
                        collisionProbability: probability,
                        riskCategory: riskCategory,
                        confidence: 0.7 + Math.random() * 0.3,
                        minimumDistance: Math.random() * 10000,
                        timeToClosestApproach: Math.random() * 30
                    }
                });
            }

            const high = assessments.filter(a => a.prediction.riskCategory === 'High').length;
            const medium = assessments.filter(a => a.prediction.riskCategory === 'Medium').length;
            const low = assessments.filter(a => a.prediction.riskCategory === 'Low').length;

            // Check for high risk collisions and create notifications
            const highRiskAssessments = assessments.filter(a => a.prediction.riskCategory === 'High');
            if (highRiskAssessments.length > 0) {
                // Add notification for each high risk assessment (limit to prevent too many notifications)
                highRiskAssessments.slice(0, 2).forEach(risk => {
                    createNotification(risk);
                });
            }

            setMockData({
                totalPairs,
                high,
                medium,
                low,
                riskAssessments: assessments
            });
        };

        generateMockData();
        const interval = setInterval(generateMockData, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, [neoNames, satelliteNames]);

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

    return (
        <div className="collision-demo">
            {/* Collision Risk Panel */}
            <div className={`collision-risk-panel ${isVisible ? 'expanded' : ''}`}>
                <div className="panel-header" onClick={() => setIsVisible(!isVisible)}>
                    <h3>Collision Risk Assessment</h3>
                    <span className="toggle-icon">{isVisible ? '▼' : '▶'}</span>
                </div>

                {isVisible && (
                    <div className="panel-content">
                        {/* Risk Statistics */}
                        <div className="risk-statistics">
                            <div className="stat-item">
                                <span className="stat-label">Total Pairs:</span>
                                <span className="stat-value">{mockData.totalPairs}</span>
                            </div>
                            <div className="stat-item high-risk">
                                <span className="stat-label">High Risk:</span>
                                <span className="stat-value">{mockData.high}</span>
                            </div>
                            <div className="stat-item medium-risk">
                                <span className="stat-label">Medium Risk:</span>
                                <span className="stat-value">{mockData.medium}</span>
                            </div>
                            <div className="stat-item low-risk">
                                <span className="stat-label">Low Risk:</span>
                                <span className="stat-value">{mockData.low}</span>
                            </div>
                        </div>

                        {/* Risk List */}
                        {showPredictions && (
                        <div className="risk-list">
                            {mockData.riskAssessments
                                .filter(r => r.prediction.riskCategory !== 'Low')
                                .slice(0, 10)
                                .map((risk, index) => (
                                <div 
                                    key={index}
                                    className="risk-item"
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
                        )}
                    </div>
                )}
            </div>

            {/* Alert System */}
            <div className="alert-system">
                <button 
                    onClick={() => window.location.href = '/'} 
                    className="nav-button home-button"
                    title="Go to Home"
                >
                    <span className="home-icon">🏠</span>
                    <span>Home</span>
                </button>
                <div className="alert-button has-alerts" onClick={() => setShowNotifications(!showNotifications)}>
                    <span className="alert-icon">🔔</span>
                    <span className="alert-badge">{notifications.filter(n => !n.read).length}</span>
                </div>
                
                {showNotifications && (
                    <div className="notifications-panel">
                        <div className="notifications-header">
                            <h3>Collision Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="close-button">×</button>
                        </div>
                        <div className="notifications-content">
                            {notifications.length === 0 ? (
                                <div className="no-notifications">No collision notifications</div>
                            ) : (
                                <div className="notifications-list">
                                    {[...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((notification) => (
                                        <div 
                                            key={notification.id} 
                                            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                        >
                                            <div className="notification-header">
                                                <span className="notification-icon">⚠️</span>
                                                <span className="notification-title">High Risk Collision Detected</span>
                                                <span className="notification-time">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="notification-body">
                                                <p>
                                                    <strong>Objects:</strong> {notification.risk && notification.risk.objects ? notification.risk.objects.join(' and ') : 
                                                    (notification.risk && notification.risk.object1 && notification.risk.object2) ? 
                                                    `${notification.risk.object1} and ${notification.risk.object2}` : 'Unknown objects'}
                                                </p>
                                                <p>
                                                    <strong>Probability:</strong> {notification.risk && notification.risk.prediction ? 
                                                        (notification.risk.prediction.probability ? 
                                                            (notification.risk.prediction.probability * 100).toFixed(4) : 
                                                            (notification.risk.prediction.collisionProbability ? 
                                                                (notification.risk.prediction.collisionProbability * 100).toFixed(4) : 
                                                                '0')
                                                        ) : '0'}%
                                                </p>
                                                <p>
                                                    <strong>Nearest Planet:</strong> {notification.nearestPlanet}
                                                </p>
                                                <p>
                                                    <strong>Distance from Earth:</strong> {notification.distanceFromEarth ? notification.distanceFromEarth.toLocaleString() : '0'} km
                                                </p>
                                                <p>
                                                    <strong>Minimum Distance:</strong> {notification.risk && notification.risk.prediction && notification.risk.prediction.minimumDistance ? 
                                                        notification.risk.prediction.minimumDistance.toFixed(0) : '0'} km
                                                </p>
                                            </div>
                                            <div className="notification-actions">
                                                <button 
                                                    onClick={() => {
                                                        // Mark as read in Firebase
                                                        markNotificationAsRead(notification.id);
                                                    }}
                                                    className="read-button"
                                                >
                                                    Mark as Read
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        // Delete notification
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="export-button"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="notifications-footer">
                            <button 
                                onClick={() => {
                                    // Clear all notifications from Firebase
                                    clearAllNotifications();
                                }}
                                className="export-all-button"
                            >
                                Clear All Notifications
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default CollisionDemo;

