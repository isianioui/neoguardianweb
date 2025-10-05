/**
 * Configuration for collision detection system
 */

export const COLLISION_CONFIG = {
    // API Configuration
    NASA_API_KEY: process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY',
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
    API_KEY: process.env.REACT_APP_API_KEY || 'demo_key',

    // Update Intervals
    DATA_UPDATE_INTERVAL: parseInt(process.env.REACT_APP_COLLISION_UPDATE_INTERVAL) || 60000, // 1 minute
    ML_PREDICTION_INTERVAL: 300000, // 5 minutes
    CACHE_TTL: 300000, // 5 minutes

    // Risk Assessment
    RISK_THRESHOLD: parseFloat(process.env.REACT_APP_RISK_THRESHOLD) || 0.01,
    HIGH_RISK_THRESHOLD: 0.1,
    MEDIUM_RISK_THRESHOLD: 0.01,
    LOW_RISK_THRESHOLD: 0.001,

    // ML Model Configuration
    MODEL_VERSION: process.env.REACT_APP_ML_MODEL_VERSION || '1.0.0',
    PREDICTION_HORIZON: 30, // days
    TRAJECTORY_STEPS: 100,
    CONFIDENCE_THRESHOLD: 0.7,

    // Visualization
    MAX_VISIBLE_NEOS: 999,
    MAX_VISIBLE_SATELLITES: 100,
    NEO_RADIUS: 0.01,
    RISK_INDICATOR_SIZE: 0.02,
    HEATMAP_RESOLUTION: 32,

    // Alert Configuration
    ALERT_RETENTION_DAYS: 7,
    MAX_ALERTS: 100,
    ALERT_SOUND_ENABLED: true,

    // Development
    DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
    MOCK_DATA: process.env.REACT_APP_MOCK_DATA === 'true',
    LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info'
};

export const RISK_CATEGORIES = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
};

export const RISK_COLORS = {
    [RISK_CATEGORIES.LOW]: '#44ff44',
    [RISK_CATEGORIES.MEDIUM]: '#ffaa00',
    [RISK_CATEGORIES.HIGH]: '#ff4444',
    [RISK_CATEGORIES.CRITICAL]: '#ff0000'
};

export const ALERT_TYPES = {
    HIGH_RISK: 'high_risk',
    MEDIUM_RISK: 'medium_risk',
    LOW_RISK: 'low_risk',
    COLLISION_EVENT: 'collision_event',
    SYSTEM_UPDATE: 'system_update'
};

export const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

export default COLLISION_CONFIG;

