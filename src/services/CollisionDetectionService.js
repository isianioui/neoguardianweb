/**
 * Collision Detection Service - Main orchestrator for collision detection system
 */
import DataService from './DataService.js';
import MLPredictionService from './MLPredictionService.js';

class CollisionDetectionService {
    constructor() {
        this.dataService = new DataService();
        this.mlService = new MLPredictionService();
        this.isRunning = false;
        this.updateInterval = null;
        this.callbacks = new Set();
        this.currentData = {
            neos: [],
            satellites: [],
            collisionEvents: [],
            riskAssessments: []
        };
    }

    /**
     * Initialize the collision detection system
     */
    async initialize() {
        try {
            console.log('Initializing collision detection system...');
            
            // Initialize ML models
            await this.mlService.initializeModels();
            
            // Load initial data
            await this.loadInitialData();
            
            console.log('Collision detection system initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing collision detection system:', error);
            return false;
        }
    }

    /**
     * Load initial data from various sources
     */
    async loadInitialData() {
        try {
            const [neoData, satelliteData, collisionData] = await Promise.all([
                this.dataService.fetchRealTimeNEOData(),
                this.dataService.fetchSatelliteData(),
                this.dataService.fetchCollisionEvents()
            ]);

            this.currentData.neos = neoData;
            this.currentData.satellites = satelliteData;
            this.currentData.collisionEvents = collisionData;

            // Perform initial risk assessment
            await this.performRiskAssessment();

            console.log(`Loaded ${neoData.length} NEOs, ${satelliteData.length} satellites, ${collisionData.length} collision events`);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Start real-time collision detection
     */
    startRealTimeDetection(updateInterval = 60000) {
        if (this.isRunning) {
            console.warn('Collision detection is already running');
            return;
        }

        this.isRunning = true;
        this.updateInterval = setInterval(async () => {
            await this.performRealTimeUpdate();
        }, updateInterval);

        console.log('Real-time collision detection started');
    }

    /**
     * Stop real-time collision detection
     */
    stopRealTimeDetection() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('Real-time collision detection stopped');
    }

    /**
     * Perform real-time update
     */
    async performRealTimeUpdate() {
        try {
            // Update data
            await this.loadInitialData();
            
            // Notify callbacks
            this.notifyCallbacks({
                type: 'data_update',
                data: this.currentData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error in real-time update:', error);
        }
    }

    /**
     * Perform risk assessment for all objects
     */
    async performRiskAssessment() {
        try {
            const allObjects = [...this.currentData.neos, ...this.currentData.satellites];
            const riskAssessment = await this.mlService.assessOverallRisk(allObjects);
            
            this.currentData.riskAssessments = riskAssessment.predictions;
            
            // Notify callbacks about risk assessment
            this.notifyCallbacks({
                type: 'risk_assessment',
                data: riskAssessment,
                timestamp: new Date().toISOString()
            });

            return riskAssessment;
        } catch (error) {
            console.error('Error performing risk assessment:', error);
            return null;
        }
    }

    /**
     * Get collision risk between two specific objects
     */
    async getCollisionRisk(object1Id, object2Id, timeHorizon = 30) {
        try {
            const object1 = this.findObjectById(object1Id);
            const object2 = this.findObjectById(object2Id);

            if (!object1 || !object2) {
                throw new Error('One or both objects not found');
            }

            const prediction = await this.mlService.predictCollisionRisk(object1, object2, timeHorizon);
            
            return {
                object1: { id: object1Id, name: object1.name },
                object2: { id: object2Id, name: object2.name },
                prediction,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting collision risk:', error);
            return null;
        }
    }

    /**
     * Get trajectory prediction for an object
     */
    async getTrajectoryPrediction(objectId, timeSteps = 100) {
        try {
            const object = this.findObjectById(objectId);
            if (!object) {
                throw new Error('Object not found');
            }

            const trajectory = await this.mlService.predictTrajectory(object, timeSteps);
            
            return {
                object: { id: objectId, name: object.name },
                trajectory,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting trajectory prediction:', error);
            return null;
        }
    }

    /**
     * Get high-risk objects
     */
    getHighRiskObjects() {
        return this.currentData.riskAssessments
            .filter(assessment => assessment.prediction.riskCategory === 'High')
            .map(assessment => ({
                object1: assessment.object1,
                object2: assessment.object2,
                risk: assessment.prediction
            }));
    }

    /**
     * Get risk statistics
     */
    getRiskStatistics() {
        const assessments = this.currentData.riskAssessments;
        const total = assessments.length;
        const high = assessments.filter(a => a.prediction.riskCategory === 'High').length;
        const medium = assessments.filter(a => a.prediction.riskCategory === 'Medium').length;
        const low = assessments.filter(a => a.prediction.riskCategory === 'Low').length;

        return {
            total,
            high,
            medium,
            low,
            highPercentage: total > 0 ? (high / total) * 100 : 0,
            mediumPercentage: total > 0 ? (medium / total) * 100 : 0,
            lowPercentage: total > 0 ? (low / total) * 100 : 0
        };
    }

    /**
     * Find object by ID
     */
    findObjectById(id) {
        return [...this.currentData.neos, ...this.currentData.satellites]
            .find(obj => obj.id === id);
    }

    /**
     * Add callback for real-time updates
     */
    addCallback(callback) {
        this.callbacks.add(callback);
    }

    /**
     * Remove callback
     */
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }

    /**
     * Notify all callbacks
     */
    notifyCallbacks(update) {
        this.callbacks.forEach(callback => {
            try {
                callback(update);
            } catch (error) {
                console.error('Error in callback:', error);
            }
        });
    }

    /**
     * Get current system status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            dataCounts: {
                neos: this.currentData.neos.length,
                satellites: this.currentData.satellites.length,
                collisionEvents: this.currentData.collisionEvents.length,
                riskAssessments: this.currentData.riskAssessments.length
            },
            lastUpdate: this.currentData.lastUpdate || null,
            mlInitialized: this.mlService.isInitialized
        };
    }

    /**
     * Get all current data
     */
    getAllData() {
        return {
            ...this.currentData,
            riskStatistics: this.getRiskStatistics(),
            highRiskObjects: this.getHighRiskObjects(),
            status: this.getStatus()
        };
    }
}

export default CollisionDetectionService;

