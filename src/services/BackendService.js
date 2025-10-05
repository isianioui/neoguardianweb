/**
 * Backend Service for ML model serving and API communication
 */
class BackendService {
    constructor() {
        this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        this.apiKey = process.env.REACT_APP_API_KEY || 'demo_key';
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Initialize connection to backend
     */
    async initialize() {
        try {
            const response = await this.healthCheck();
            this.isConnected = response.status === 'ok';
            console.log('Backend service initialized:', this.isConnected);
            return this.isConnected;
        } catch (error) {
            console.error('Failed to initialize backend service:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Health check error:', error);
            throw error;
        }
    }

    /**
     * Predict collision risk using ML models
     */
    async predictCollisionRisk(object1, object2, timeHorizon = 30) {
        try {
            const response = await this.makeRequest('/api/predict/collision', {
                method: 'POST',
                body: JSON.stringify({
                    object1,
                    object2,
                    timeHorizon
                })
            });

            return response;
        } catch (error) {
            console.error('Collision prediction error:', error);
            // Return mock data if backend is unavailable
            return this.getMockCollisionPrediction(object1, object2, timeHorizon);
        }
    }

    /**
     * Predict trajectory for an object
     */
    async predictTrajectory(object, timeSteps = 100) {
        try {
            const response = await this.makeRequest('/api/predict/trajectory', {
                method: 'POST',
                body: JSON.stringify({
                    object,
                    timeSteps
                })
            });

            return response;
        } catch (error) {
            console.error('Trajectory prediction error:', error);
            // Return mock data if backend is unavailable
            return this.getMockTrajectoryPrediction(object, timeSteps);
        }
    }

    /**
     * Batch predict multiple object pairs
     */
    async batchPredictCollisionRisks(objects, timeHorizon = 30) {
        try {
            const response = await this.makeRequest('/api/predict/batch', {
                method: 'POST',
                body: JSON.stringify({
                    objects,
                    timeHorizon
                })
            });

            return response;
        } catch (error) {
            console.error('Batch prediction error:', error);
            // Return mock data if backend is unavailable
            return this.getMockBatchPrediction(objects, timeHorizon);
        }
    }

    /**
     * Get model performance metrics
     */
    async getModelMetrics() {
        try {
            const response = await this.makeRequest('/api/models/metrics', {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Model metrics error:', error);
            return this.getMockModelMetrics();
        }
    }

    /**
     * Update model with new data
     */
    async updateModel(trainingData) {
        try {
            const response = await this.makeRequest('/api/models/update', {
                method: 'POST',
                body: JSON.stringify({
                    trainingData
                })
            });

            return response;
        } catch (error) {
            console.error('Model update error:', error);
            throw error;
        }
    }

    /**
     * Get real-time data from external APIs
     */
    async getRealTimeData(dataType, params = {}) {
        try {
            const response = await this.makeRequest(`/api/data/realtime/${dataType}`, {
                method: 'GET',
                query: params
            });

            return response;
        } catch (error) {
            console.error('Real-time data error:', error);
            return this.getMockRealTimeData(dataType, params);
        }
    }

    /**
     * Make HTTP request with error handling and retries
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.retryCount = 0; // Reset retry count on success
            return data;
        } catch (error) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying request (${this.retryCount}/${this.maxRetries})...`);
                await this.delay(1000 * this.retryCount); // Exponential backoff
                return this.makeRequest(endpoint, options);
            } else {
                this.retryCount = 0;
                throw error;
            }
        }
    }

    /**
     * Delay utility for retries
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Mock collision prediction for offline mode
     */
    getMockCollisionPrediction(object1, object2, timeHorizon) {
        const baseProbability = Math.random() * 0.001;
        const timeFactor = Math.exp(-timeHorizon / 30);
        const distanceFactor = Math.random() * 0.1;
        
        const collisionProbability = baseProbability * timeFactor * distanceFactor;
        
        let riskCategory = 'Low';
        if (collisionProbability > 0.01) riskCategory = 'High';
        else if (collisionProbability > 0.001) riskCategory = 'Medium';

        return {
            collisionProbability,
            riskCategory,
            confidence: 0.7 + Math.random() * 0.3,
            timeToClosestApproach: Math.random() * timeHorizon,
            minimumDistance: Math.random() * 10000,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Mock trajectory prediction for offline mode
     */
    getMockTrajectoryPrediction(object, timeSteps) {
        const positions = [];
        const velocities = [];
        const uncertainties = [];

        for (let i = 0; i < timeSteps; i++) {
            const t = i / timeSteps;
            const x = Math.cos(t * Math.PI * 2) * (1 + Math.random() * 0.1);
            const y = Math.sin(t * Math.PI * 2) * (1 + Math.random() * 0.1);
            const z = Math.sin(t * Math.PI * 4) * 0.5;

            positions.push({ x, y, z });
            velocities.push({
                x: -Math.sin(t * Math.PI * 2) * 0.1,
                y: Math.cos(t * Math.PI * 2) * 0.1,
                z: Math.cos(t * Math.PI * 4) * 0.05
            });
            uncertainties.push(Math.random() * 0.1);
        }

        return {
            positions,
            velocities,
            uncertainties,
            timeSteps: Array.from({ length: timeSteps }, (_, i) => i),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Mock batch prediction for offline mode
     */
    getMockBatchPrediction(objects, timeHorizon) {
        const predictions = [];
        
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                const prediction = this.getMockCollisionPrediction(objects[i], objects[j], timeHorizon);
                predictions.push({
                    object1: objects[i].id,
                    object2: objects[j].id,
                    prediction
                });
            }
        }

        return {
            predictions,
            totalPairs: predictions.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Mock model metrics for offline mode
     */
    getMockModelMetrics() {
        return {
            accuracy: 0.85 + Math.random() * 0.1,
            precision: 0.82 + Math.random() * 0.1,
            recall: 0.78 + Math.random() * 0.1,
            f1Score: 0.80 + Math.random() * 0.1,
            lastUpdated: new Date().toISOString(),
            modelVersion: '1.0.0',
            trainingDataSize: 10000 + Math.floor(Math.random() * 5000)
        };
    }

    /**
     * Mock real-time data for offline mode
     */
    getMockRealTimeData(dataType, params) {
        switch (dataType) {
            case 'neo':
                return this.getMockNEOData();
            case 'satellite':
                return this.getMockSatelliteData();
            case 'collision':
                return this.getMockCollisionData();
            default:
                return { data: [], timestamp: new Date().toISOString() };
        }
    }

    getMockNEOData() {
        return {
            data: Array.from({ length: 10 }, (_, i) => ({
                id: `neo_${i}`,
                name: `Mock NEO ${i}`,
                diameter: Math.random() * 100,
                isHazardous: Math.random() > 0.7,
                orbitalData: {
                    eccentricity: Math.random(),
                    semiMajorAxis: 1 + Math.random() * 2,
                    inclination: Math.random() * 180,
                    longitudeOfAscendingNode: Math.random() * 360,
                    argumentOfPeriapsis: Math.random() * 360,
                    meanAnomaly: Math.random() * 360
                }
            })),
            timestamp: new Date().toISOString()
        };
    }

    getMockSatelliteData() {
        return {
            data: Array.from({ length: 5 }, (_, i) => ({
                id: `sat_${i}`,
                name: `Mock Satellite ${i}`,
                type: ['Communication', 'Weather', 'Navigation', 'Scientific', 'Military'][i],
                altitude: 400 + Math.random() * 600,
                inclination: Math.random() * 180,
                period: 90 + Math.random() * 20
            })),
            timestamp: new Date().toISOString()
        };
    }

    getMockCollisionData() {
        return {
            data: Array.from({ length: 3 }, (_, i) => ({
                eventId: `collision_${i}`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                objects: [`Object A${i}`, `Object B${i}`],
                impactEnergy: Math.random() * 20000,
                debrisCreated: Math.floor(Math.random() * 500),
                orbitalAltitude: 400 + Math.random() * 400,
                consequences: 'Debris field created',
                riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
            })),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            baseUrl: this.baseUrl,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }
}

export default BackendService;

