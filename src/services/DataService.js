/**
 * Main data service for fetching and managing real-time NEO and collision data
 */
class DataService {
    constructor() {
        this.nasaApiKey = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';
        this.cache = new Map();
        this.updateInterval = 60000; // 1 minute
        this.baseUrls = {
            nasa: 'https://api.nasa.gov/neo/rest/v1',
            spaceTrack: 'https://www.space-track.org/api',
            esa: 'https://www.esa.int/Space_Safety/Space_Debris'
        };
    }

    /**
     * Fetch real-time NEO data from NASA API
     */
    async fetchRealTimeNEOData(startDate = null, endDate = null) {
        try {
            const today = new Date();
            const start = startDate || this.formatDate(today);
            const end = endDate || this.formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

            const url = `${this.baseUrls.nasa}/feed?start_date=${start}&end_date=${end}&api_key=${this.nasaApiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`NASA API error: ${response.status}`);
            }

            const data = await response.json();
            return this.processNEOData(data);
        } catch (error) {
            console.error('Error fetching real-time NEO data:', error);
            return this.getCachedData('neo_data') || [];
        }
    }

    /**
     * Fetch specific NEO details by ID
     */
    async fetchNEODetails(neoId) {
        try {
            const url = `${this.baseUrls.nasa}/neo/${neoId}?api_key=${this.nasaApiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`NASA API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching NEO details:', error);
            return null;
        }
    }

    /**
     * Fetch historical collision events
     */
    async fetchCollisionEvents() {
        try {
            // For now, we'll use a mock dataset
            // In production, this would connect to a real collision database
            const mockCollisionData = await this.getMockCollisionData();
            return mockCollisionData;
        } catch (error) {
            console.error('Error fetching collision events:', error);
            return [];
        }
    }

    /**
     * Fetch satellite and debris tracking data
     */
    async fetchSatelliteData() {
        try {
            // Mock satellite data for now
            const mockSatelliteData = await this.getMockSatelliteData();
            return mockSatelliteData;
        } catch (error) {
            console.error('Error fetching satellite data:', error);
            return [];
        }
    }

    /**
     * Process raw NEO data into standardized format
     */
    processNEOData(rawData) {
        const processedData = [];
        
        if (rawData.near_earth_objects) {
            Object.entries(rawData.near_earth_objects).forEach(([date, neos]) => {
                neos.forEach(neo => {
                    processedData.push({
                        id: neo.id,
                        name: neo.name,
                        diameter: neo.estimated_diameter?.meters?.estimated_diameter_max || 0,
                        isHazardous: neo.is_potentially_hazardous_asteroid,
                        closeApproachData: neo.close_approach_data?.map(approach => ({
                            date: approach.close_approach_date,
                            distance: parseFloat(approach.miss_distance?.kilometers || 0),
                            velocity: parseFloat(approach.relative_velocity?.kilometers_per_hour || 0),
                            orbitingBody: approach.orbiting_body
                        })) || [],
                        orbitalData: neo.orbital_data ? {
                            eccentricity: parseFloat(neo.orbital_data.eccentricity || 0),
                            semiMajorAxis: parseFloat(neo.orbital_data.semi_major_axis || 0),
                            inclination: parseFloat(neo.orbital_data.inclination || 0),
                            longitudeOfAscendingNode: parseFloat(neo.orbital_data.longitude_of_ascending_node || 0),
                            argumentOfPeriapsis: parseFloat(neo.orbital_data.argument_of_periapsis || 0),
                            meanAnomaly: parseFloat(neo.orbital_data.mean_anomaly || 0)
                        } : null,
                        lastUpdated: new Date().toISOString()
                    });
                });
            });
        }

        this.cacheData('neo_data', processedData);
        return processedData;
    }

    /**
     * Get mock collision data for development
     */
    async getMockCollisionData() {
        return [
            {
                eventId: 'COLL_2023_001',
                date: '2023-03-15T14:30:00Z',
                objects: ['Iridium 33', 'Cosmos 2251'],
                impactEnergy: 15000,
                debrisCreated: 250,
                orbitalAltitude: 400,
                consequences: 'Major debris field created',
                riskLevel: 'High'
            },
            {
                eventId: 'COLL_2023_002',
                date: '2023-07-22T09:15:00Z',
                objects: ['Debris_A', 'Debris_B'],
                impactEnergy: 5000,
                debrisCreated: 100,
                orbitalAltitude: 600,
                consequences: 'Minor debris field',
                riskLevel: 'Medium'
            }
        ];
    }

    /**
     * Get mock satellite data for development
     */
    async getMockSatelliteData() {
        return [
            {
                id: 'SAT_001',
                name: 'International Space Station',
                type: 'Manned Spacecraft',
                altitude: 408,
                inclination: 51.6,
                period: 92.7,
                lastUpdated: new Date().toISOString()
            },
            {
                id: 'SAT_002',
                name: 'Hubble Space Telescope',
                type: 'Scientific Satellite',
                altitude: 540,
                inclination: 28.5,
                period: 95.4,
                lastUpdated: new Date().toISOString()
            }
        ];
    }

    /**
     * Cache data with timestamp
     */
    cacheData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: 300000 // 5 minutes
        });
    }

    /**
     * Get cached data if still valid
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
            return cached.data;
        }
        return null;
    }

    /**
     * Format date for API calls
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Start real-time data updates
     */
    startRealTimeUpdates(callback) {
        this.updateInterval = setInterval(async () => {
            try {
                const neoData = await this.fetchRealTimeNEOData();
                const collisionData = await this.fetchCollisionEvents();
                const satelliteData = await this.fetchSatelliteData();
                
                if (callback) {
                    callback({
                        neoData,
                        collisionData,
                        satelliteData,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Error in real-time update:', error);
            }
        }, this.updateInterval);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export default DataService;

