/**
 * Data models and types for collision detection system
 */

/**
 * Base object model for all space objects
 */
export class SpaceObject {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type || 'Unknown';
        this.diameter = data.diameter || 0;
        this.mass = data.mass || 0;
        this.position = data.position || { x: 0, y: 0, z: 0 };
        this.velocity = data.velocity || { x: 0, y: 0, z: 0 };
        this.orbitalData = data.orbitalData || null;
        this.isHazardous = data.isHazardous || false;
        this.lastUpdated = data.lastUpdated || new Date().toISOString();
    }

    /**
     * Calculate distance to another object
     */
    distanceTo(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const dz = this.position.z - other.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate relative velocity to another object
     */
    relativeVelocityTo(other) {
        const dvx = this.velocity.x - other.velocity.x;
        const dvy = this.velocity.y - other.velocity.y;
        const dvz = this.velocity.z - other.velocity.z;
        return Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);
    }

    /**
     * Update position and velocity
     */
    updateState(position, velocity) {
        this.position = position;
        this.velocity = velocity;
        this.lastUpdated = new Date().toISOString();
    }
}

/**
 * NEO (Near-Earth Object) model
 */
export class NEO extends SpaceObject {
    constructor(data) {
        super(data);
        this.type = 'NEO';
        this.closeApproachData = data.closeApproachData || [];
        this.riskAssessment = data.riskAssessment || null;
        this.impactEnergy = data.impactEnergy || 0;
    }

    /**
     * Get closest approach to Earth
     */
    getClosestApproachToEarth() {
        if (!this.closeApproachData || this.closeApproachData.length === 0) {
            return null;
        }

        return this.closeApproachData.reduce((closest, approach) => {
            return approach.distance < closest.distance ? approach : closest;
        });
    }

    /**
     * Calculate impact energy based on size and velocity
     */
    calculateImpactEnergy() {
        const velocity = this.relativeVelocityTo({ velocity: { x: 0, y: 0, z: 0 } });
        const mass = this.mass || (this.diameter * this.diameter * this.diameter * 0.001); // Rough mass estimate
        return 0.5 * mass * velocity * velocity;
    }
}

/**
 * Satellite model
 */
export class Satellite extends SpaceObject {
    constructor(data) {
        super(data);
        this.type = 'Satellite';
        this.altitude = data.altitude || 0;
        this.inclination = data.inclination || 0;
        this.period = data.period || 0;
        this.operator = data.operator || 'Unknown';
        this.launchDate = data.launchDate || null;
        this.status = data.status || 'Active';
    }

    /**
     * Calculate orbital period from altitude
     */
    calculatePeriod() {
        const earthRadius = 6371; // km
        const altitude = this.altitude;
        const semiMajorAxis = earthRadius + altitude;
        const mu = 398600.4418; // km³/s² (Earth's gravitational parameter)
        
        return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu) / 3600; // hours
    }
}

/**
 * Collision prediction model
 */
export class CollisionPrediction {
    constructor(data) {
        this.object1 = data.object1;
        this.object2 = data.object2;
        this.collisionProbability = data.collisionProbability || 0;
        this.riskCategory = data.riskCategory || 'Low';
        this.confidence = data.confidence || 0;
        this.timeToClosestApproach = data.timeToClosestApproach || 0;
        this.minimumDistance = data.minimumDistance || 0;
        this.predictionHorizon = data.predictionHorizon || 30;
        this.features = data.features || {};
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    /**
     * Get risk level as number (0-3)
     */
    getRiskLevel() {
        switch (this.riskCategory) {
            case 'Low': return 0;
            case 'Medium': return 1;
            case 'High': return 2;
            case 'Critical': return 3;
            default: return 0;
        }
    }

    /**
     * Check if prediction is high risk
     */
    isHighRisk() {
        return this.riskCategory === 'High' || this.riskCategory === 'Critical';
    }

    /**
     * Get risk color for visualization
     */
    getRiskColor() {
        switch (this.riskCategory) {
            case 'Low': return '#44ff44';
            case 'Medium': return '#ffaa00';
            case 'High': return '#ff4444';
            case 'Critical': return '#ff0000';
            default: return '#666666';
        }
    }
}

/**
 * Trajectory prediction model
 */
export class TrajectoryPrediction {
    constructor(data) {
        this.object = data.object;
        this.positions = data.positions || [];
        this.velocities = data.velocities || [];
        this.uncertainties = data.uncertainties || [];
        this.timeSteps = data.timeSteps || [];
        this.predictionHorizon = data.predictionHorizon || 30;
        this.confidence = data.confidence || 0;
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    /**
     * Get position at specific time step
     */
    getPositionAtTime(timeStep) {
        const index = this.timeSteps.indexOf(timeStep);
        if (index >= 0 && index < this.positions.length) {
            return this.positions[index];
        }
        return null;
    }

    /**
     * Get velocity at specific time step
     */
    getVelocityAtTime(timeStep) {
        const index = this.timeSteps.indexOf(timeStep);
        if (index >= 0 && index < this.velocities.length) {
            return this.velocities[index];
        }
        return null;
    }

    /**
     * Get uncertainty at specific time step
     */
    getUncertaintyAtTime(timeStep) {
        const index = this.timeSteps.indexOf(timeStep);
        if (index >= 0 && index < this.uncertainties.length) {
            return this.uncertainties[index];
        }
        return null;
    }
}

/**
 * Collision event model
 */
export class CollisionEvent {
    constructor(data) {
        this.eventId = data.eventId;
        this.date = data.date;
        this.objects = data.objects || [];
        this.impactEnergy = data.impactEnergy || 0;
        this.debrisCreated = data.debrisCreated || 0;
        this.orbitalAltitude = data.orbitalAltitude || 0;
        this.consequences = data.consequences || '';
        this.riskLevel = data.riskLevel || 'Low';
        this.location = data.location || null;
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    /**
     * Get severity level as number (0-4)
     */
    getSeverityLevel() {
        switch (this.riskLevel) {
            case 'Low': return 0;
            case 'Medium': return 1;
            case 'High': return 2;
            case 'Critical': return 3;
            case 'Catastrophic': return 4;
            default: return 0;
        }
    }

    /**
     * Check if event is recent (within last 30 days)
     */
    isRecent() {
        const eventDate = new Date(this.date);
        const now = new Date();
        const diffTime = Math.abs(now - eventDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    }
}

/**
 * Risk assessment model
 */
export class RiskAssessment {
    constructor(data) {
        this.totalPairs = data.totalPairs || 0;
        this.highRiskPairs = data.highRiskPairs || 0;
        this.mediumRiskPairs = data.mediumRiskPairs || 0;
        this.lowRiskPairs = data.lowRiskPairs || 0;
        this.overallRiskLevel = data.overallRiskLevel || 'Low';
        this.predictions = data.predictions || [];
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    /**
     * Get risk statistics as percentages
     */
    getRiskPercentages() {
        const total = this.totalPairs;
        if (total === 0) {
            return {
                high: 0,
                medium: 0,
                low: 0
            };
        }

        return {
            high: (this.highRiskPairs / total) * 100,
            medium: (this.mediumRiskPairs / total) * 100,
            low: (this.lowRiskPairs / total) * 100
        };
    }

    /**
     * Get high-risk predictions
     */
    getHighRiskPredictions() {
        return this.predictions.filter(p => p.prediction.riskCategory === 'High');
    }

    /**
     * Get medium-risk predictions
     */
    getMediumRiskPredictions() {
        return this.predictions.filter(p => p.prediction.riskCategory === 'Medium');
    }

    /**
     * Get low-risk predictions
     */
    getLowRiskPredictions() {
        return this.predictions.filter(p => p.prediction.riskCategory === 'Low');
    }
}

/**
 * Alert model
 */
export class Alert {
    constructor(data) {
        this.id = data.id;
        this.type = data.type || 'info';
        this.title = data.title || '';
        this.message = data.message || '';
        this.details = data.details || {};
        this.priority = data.priority || 'low';
        this.isRead = data.isRead || false;
        this.timestamp = data.timestamp || new Date().toISOString();
    }

    /**
     * Get priority level as number (0-3)
     */
    getPriorityLevel() {
        switch (this.priority) {
            case 'low': return 0;
            case 'medium': return 1;
            case 'high': return 2;
            case 'critical': return 3;
            default: return 0;
        }
    }

    /**
     * Get priority color
     */
    getPriorityColor() {
        switch (this.priority) {
            case 'low': return '#44ff44';
            case 'medium': return '#ffaa00';
            case 'high': return '#ff4444';
            case 'critical': return '#ff0000';
            default: return '#666666';
        }
    }

    /**
     * Mark as read
     */
    markAsRead() {
        this.isRead = true;
    }

    /**
     * Mark as unread
     */
    markAsUnread() {
        this.isRead = false;
    }
}

/**
 * Model factory for creating instances
 */
export class ModelFactory {
    /**
     * Create space object from data
     */
    static createSpaceObject(data) {
        switch (data.type) {
            case 'NEO':
                return new NEO(data);
            case 'Satellite':
                return new Satellite(data);
            default:
                return new SpaceObject(data);
        }
    }

    /**
     * Create collision prediction from data
     */
    static createCollisionPrediction(data) {
        return new CollisionPrediction(data);
    }

    /**
     * Create trajectory prediction from data
     */
    static createTrajectoryPrediction(data) {
        return new TrajectoryPrediction(data);
    }

    /**
     * Create collision event from data
     */
    static createCollisionEvent(data) {
        return new CollisionEvent(data);
    }

    /**
     * Create risk assessment from data
     */
    static createRiskAssessment(data) {
        return new RiskAssessment(data);
    }

    /**
     * Create alert from data
     */
    static createAlert(data) {
        return new Alert(data);
    }
}

export default {
    SpaceObject,
    NEO,
    Satellite,
    CollisionPrediction,
    TrajectoryPrediction,
    CollisionEvent,
    RiskAssessment,
    Alert,
    ModelFactory
};

