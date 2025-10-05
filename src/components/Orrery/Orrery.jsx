
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOrbit, getOrbitPosition, JulianDateToTrueAnomaly } from '../../utils/orbits.js';
import { JDToMJD, MJDToDatetime, MJDToJD } from '../../utils/TimeUtils.js';
import './Orrery.css';

// Constants
const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_MESH_N = 32;
const ORBIT_MESH_POINTS = 192;

const SHOWER_ORBIT_COLOR = 0x5D5CD2; 
const SHOWER_ORBIT_COLOR_NOTVIS = 0x4b0096;
const PARENT_ORBIT_COLOR = 0x0200b9;
const NEO_ORBIT_COLOR = 0xcd0000;
const NEO_COLOR = 0xFFFFFF;

const NEO_RADIUS = 0.01;
const MAX_VISIBLE_NEOS = 999;
const MAX_VISIBLE_SHOWERS = 999;

const MOUSE_MIN_MOVE_CLICK = 0.005;

const SUNOBLIQUITY = 7.25; // degrees
const SUNROTPER = 25.05;  // days

const TIMESPEEDS = [-365, -30, -7, -1, -3600 / 86400, -60 / 86400, -1 / 86400, 1 / 86400, 60 / 86400, 3600 / 86400, 1, 7, 30, 365];

// Label text parameters
const LABEL_SIZE = 0.1;
const X_OFFSET = 0;
const Y_OFFSET = -0.010;
const Z_OFFSET = 0;

// Helper function to validate orbital parameters
const validateOrbitParams = (orbitParams) => {
    if (!orbitParams) return null;
    
    const sanitized = { ...orbitParams };
    
    // Check for NaN or invalid values
    const requiredFields = ['a', 'e', 'inc', 'node', 'peri'];
    for (const field of requiredFields) {
        if (typeof sanitized[field] !== 'number' || 
            isNaN(sanitized[field]) || 
            !isFinite(sanitized[field])) {
            console.warn(`Invalid ${field} value:`, sanitized[field]);
            return null;
        }
    }
    
    // Validate orbital parameter ranges
    if (sanitized.a <= 0) {
        console.warn('Semi-major axis must be positive:', sanitized.a);
        return null;
    }
    
    if (sanitized.e < 0 || sanitized.e >= 1) {
        console.warn('Eccentricity must be between 0 and 1:', sanitized.e);
        // For parabolic/hyperbolic orbits, clamp to slightly less than 1
        if (sanitized.e >= 1) {
            sanitized.e = 0.999;
        }
    }
    
    return sanitized;
};

// Helper function to validate position vectors
const validatePosition = (pos) => {
    if (!pos || typeof pos !== 'object') return null;
    
    const { x, y, z } = pos;
    if (isNaN(x) || isNaN(y) || isNaN(z) ||
        !isFinite(x) || !isFinite(y) || !isFinite(z)) {
        console.warn('Invalid position values:', pos);
        return null;
    }
    
    return pos;
};

// Helper function to ensure transform matrix exists
const ensureTransformMatrix = (orbitParams) => {
    if (!orbitParams.transformMatrix) {
        // Create the transform matrix if it doesn't exist
        const cosNode = Math.cos(orbitParams.node);
        const sinNode = Math.sin(orbitParams.node);
        const cosPeri = Math.cos(orbitParams.peri);
        const sinPeri = Math.sin(orbitParams.peri);
        const cosInc = Math.cos(orbitParams.inc);
        const sinInc = Math.sin(orbitParams.inc);

        const row1 = [cosPeri * cosNode - cosInc * sinPeri * sinNode, -cosNode * sinPeri - cosInc * cosPeri * sinNode, sinInc * sinNode];
        const row2 = [cosPeri * sinNode + cosInc * cosNode * sinPeri, -sinPeri * sinNode + cosInc * cosPeri * cosNode, -sinInc * cosNode];
        const row3 = [sinInc * sinPeri, sinInc * cosPeri, cosInc];
        
        orbitParams.transformMatrix = [row1, row2, row3];
    }
    return orbitParams.transformMatrix;
};

// Safe wrapper for createOrbit function
const createOrbitSafe = (orbitParams, color, points) => {
    const validParams = validateOrbitParams(orbitParams);
    if (!validParams) {
        console.warn('Skipping orbit creation due to invalid parameters');
        return null;
    }
    
    try {
        const orbit = createOrbit(validParams, color, points);
        
        // Validate the created orbit geometry
        if (orbit && orbit.geometry && orbit.geometry.attributes.position) {
            const positions = orbit.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i++) {
                if (isNaN(positions[i]) || !isFinite(positions[i])) {
                    console.warn('Orbit geometry contains NaN/Infinity values, skipping');
                    return null;
                }
            }
        }
        
        // Ensure the transformMatrix is available for position calculations
        if (orbit && validParams.transformMatrix) {
            orbit.userData = orbit.userData || {};
            orbit.userData.transformMatrix = validParams.transformMatrix;
        }
        
        return orbit;
    } catch (error) {
        console.error('Error creating orbit:', error);
        return null;
    }
};

// Safe wrapper for getOrbitPosition function
const getOrbitPositionSafe = (a, e, trueAnomaly, transformMatrix) => {
    // Validate inputs
    if (isNaN(a) || isNaN(e) || isNaN(trueAnomaly) ||
        !isFinite(a) || !isFinite(e) || !isFinite(trueAnomaly)) {
        console.warn('Invalid orbit position parameters:', { a, e, trueAnomaly });
        return { x: 0, y: 0, z: 0 }; // Return origin as fallback
    }
    
    // Check if transformMatrix exists and is valid
    if (!transformMatrix || !Array.isArray(transformMatrix) || transformMatrix.length !== 3) {
        console.warn('Invalid or missing transform matrix:', transformMatrix);
        return { x: 0, y: 0, z: 0 };
    }
    
    try {
        const pos = getOrbitPosition(a, e, trueAnomaly, transformMatrix);
        const validPos = validatePosition(pos);
        return validPos || { x: 0, y: 0, z: 0 };
    } catch (error) {
        console.error('Error calculating orbit position:', error);
        return { x: 0, y: 0, z: 0 };
    }
};

// Filter conditions for objects
class FilterConditions {
    constructor() {
        this.riskRange = [-99, 99];
        this.sizeRange = [0, 9999];
        this.aRange = [0, 100];
        this.eRange = [0, 1];
        this.shownTypes = {'Planet': true, 'Dwarf planet': true, 'NEO': true, 'Shower': true, 'Sporadic': false};
        this.collisionDetectionActive = false;
        this.riskThreshold = -2.0; // Palermo Scale threshold for high risk
        
        // Bind the method to ensure 'this' context is preserved
        this.checkPassesFilters = this.checkPassesFilters.bind(this);
    }

    checkPassesFilters(object) {
        if (('renderParams' in object.data) && ('is_dwarf' in object.data.renderParams) && (object.data.renderParams.is_dwarf)) {
            return this.shownTypes['Dwarf planet'];
        }
        else if (('renderParams' in object.data) && ('is_dwarf' in object.data.renderParams)) {
            return this.shownTypes['Planet'];
        }
        
        // For NEOs, don't filter based on risk when collision detection is active
        if (object.data.extraParams && object.data.extraParams['PS max'] !== undefined) {
            // Apply other filters
            if ((object.data.extraParams['PS max'] < this.riskRange[0]) || (object.data.extraParams['PS max'] > this.riskRange[1]))
                return false;
            if ((object.data.extraParams.diameter < this.sizeRange[0]) || (object.data.extraParams.diameter > this.sizeRange[1]))
                return false;
            if ((object.data.orbitParams.a < this.aRange[0]) || (object.data.orbitParams.a > this.aRange[1]))
                return false;
            if ((object.data.orbitParams.e < this.eRange[0]) || (object.data.orbitParams.e > this.eRange[1]))
                return false;
        }
        
        return this.shownTypes['NEO'];
    }
    
    // Method to toggle collision detection mode
    setCollisionDetectionMode(active) {
        this.collisionDetectionActive = active;
    }
    
    // Method to set risk threshold
    setRiskThreshold(threshold) {
        this.riskThreshold = threshold;
    }
}

// Body class
class Body {
    constructor(name, data, orbitMesh, bodyMesh) {
        this.name = name;
        this.data = data;
        this.orbitMesh = orbitMesh;
        this.bodyMesh = bodyMesh;
    }

    setPosition(pos) {
        const validPos = validatePosition(pos);
        if (this.bodyMesh && validPos) {
            this.bodyMesh.position.set(validPos.x, validPos.y, validPos.z);
        }
    }
}

// Shower class
class Shower {
    constructor(name, code, orbitMeshes, parentBodyMesh, parentBodyName) {
        this.name = name;
        this.code = code;
        this.orbitMeshes = orbitMeshes;
        this.parentBodyMesh = parentBodyMesh;
        this.parentBodyName = parentBodyName;
    }

    setPosition(pos) {
        const validPos = validatePosition(pos);
        if (this.parentBodyMesh && validPos) {
            this.parentBodyMesh.position.set(validPos.x, validPos.y, validPos.z);
        }
    }

    show() {
        this.orbitMeshes.forEach(orbit => orbit.visible = true);
        if (this.parentBodyMesh) this.parentBodyMesh.visible = true;
    }

    hide() {
        this.orbitMeshes.forEach(orbit => orbit.visible = false);
        if (this.parentBodyMesh) this.parentBodyMesh.visible = false;
    }

    highlight() {
        this.orbitMeshes.forEach(orbit => orbit.material.color.set(0x00FF00));
        if (this.parentBodyMesh) this.parentBodyMesh.material.color.set(0x00FF00);
    }

    resetColor() {
        this.orbitMeshes.forEach(orbit => orbit.material.color.set(SHOWER_ORBIT_COLOR));
        if (this.parentBodyMesh) this.parentBodyMesh.material.color.set(PARENT_ORBIT_COLOR);
    }
}

const Orrery = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const animationIdRef = useRef(null);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const mouseDownRef = useRef(new THREE.Vector2());
    const mouseMoveRef = useRef(0);
    const predictionGroupRef = useRef(null);
    const heatmapGroupRef = useRef(null);
    
    // State
    const [currentTime, setCurrentTime] = useState('');
    const [timeSpeed, setTimeSpeed] = useState('Real-time');
    const [selectedObject, setSelectedObject] = useState(null);
    const [selectedObjectName, setSelectedObjectName] = useState('');
    const [filterConditions, setFilterConditions] = useState(new FilterConditions());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Time variables
    const timeRef = useRef({
        JD: (Date.now() / 86400000) + 2440587.5,
        MJD: 0,
        timeSpeedIndex: 10
    });
    
    // Data arrays
    const dataRef = useRef({
        planets: [],
        neos: [],
        showers: [],
        sunMesh: null
    });

    // Helper functions
    const normalizeAnomaly = (anomaly) => {
        return anomaly < 0 ? anomaly + 360 : anomaly;
    };

    const isEarthInStreamRange = (earthAnomaly, streamAnomalyBegin, streamAnomalyEnd) => {
        earthAnomaly = normalizeAnomaly(earthAnomaly);
        streamAnomalyBegin = normalizeAnomaly(streamAnomalyBegin);
        streamAnomalyEnd = normalizeAnomaly(streamAnomalyEnd);

        if (streamAnomalyEnd < streamAnomalyBegin) {
            return (earthAnomaly >= streamAnomalyBegin && earthAnomaly <= 360) || (earthAnomaly >= 0 && earthAnomaly <= streamAnomalyEnd);
        }
        return earthAnomaly >= streamAnomalyBegin && earthAnomaly <= streamAnomalyEnd;
    };

    const createTextTexture = (message) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 36;

        canvas.width = 256;
        canvas.height = 256;

        context.font = `${fontSize}px Verdana`;
        context.fillStyle = 'white';
        context.fillText(message, 10, fontSize);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    const readJSON = async (filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) { 
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`); 
            }
            const data = await response.json();
            console.log(`Successfully loaded ${filePath}:`, data);
            return data;
        } catch (error) { 
            console.error('There was a problem trying to read ' + filePath + ':', error); 
            return null;
        }
    };

    // Mouse event handlers
    const handleMouseDown = (event) => {
        mouseDownRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseDownRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        mouseMoveRef.current = 0;
    };

    const handleMouseMove = (event) => {
        const currentMouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        mouseMoveRef.current += mouseDownRef.current.distanceTo(currentMouse);
    };

    const handleMouseUp = (event) => {
        if (mouseMoveRef.current < MOUSE_MIN_MOVE_CLICK) {
            // This is a click, not a drag
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Raycast to find intersected objects
            raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
            
            // Get all clickable objects (planets, neos, showers)
            const clickableObjects = [];
            
            // Add planet meshes
            dataRef.current.planets.forEach(planet => {
                if (planet.bodyMesh && planet.bodyMesh.visible) {
                    clickableObjects.push(planet.bodyMesh);
                }
            });
            
            // Add NEO meshes
            dataRef.current.neos.forEach(neo => {
                if (neo.bodyMesh && neo.bodyMesh.visible) {
                    clickableObjects.push(neo.bodyMesh);
                }
            });
            
            // Add shower parent body meshes
            dataRef.current.showers.forEach(shower => {
                if (shower.parentBodyMesh && shower.parentBodyMesh.visible) {
                    clickableObjects.push(shower.parentBodyMesh);
                }
            });
            
            // Add sun
            if (dataRef.current.sunMesh) {
                clickableObjects.push(dataRef.current.sunMesh);
            }
            
            const intersects = raycasterRef.current.intersectObjects(clickableObjects);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                let objectData = null;
                
                // Find the corresponding data object
                if (clickedObject.userData && clickedObject.userData.parent) {
                    objectData = clickedObject.userData.parent;
                } else if (clickedObject === dataRef.current.sunMesh) {
                    // Handle Sun click
                    objectData = {
                        name: 'Sun',
                        data: {
                            extraParams: {
                                diameter: 1391000, // km
                                mass: '1.989 × 10³⁰ kg',
                                temperature: '5778 K',
                                type: 'Star'
                            },
                            orbitParams: {
                                a: 0,
                                e: 0,
                                inc: 0,
                                node: 0,
                                peri: 0,
                                ma: 0
                            }
                        }
                    };
                }
                
                if (objectData) {
                    setSelectedObject(objectData);
                    setSelectedObjectName(objectData.name);
                }
            } else {
                // Clicked on empty space, deselect
                setSelectedObject(null);
                setSelectedObjectName('');
            }
        }
    };

    // Format object info for display
    const formatObjectInfo = (obj) => {
        if (!obj || !obj.data) return null;
        
        const data = obj.data;
        const extraParams = data.extraParams || {};
        const orbitParams = data.orbitParams || {};
        const renderParams = data.renderParams || {};
        
        let objectType = 'Unknown';
        if (obj.name === 'Sun') {
            objectType = 'Star';
        } else if (renderParams.is_dwarf) {
            objectType = 'Dwarf Planet';
        } else if (renderParams.hasOwnProperty('is_dwarf')) {
            objectType = 'Planet';
        } else if (extraParams['PS max'] !== undefined) {
            objectType = 'Near-Earth Object';
        } else {
            objectType = 'Celestial Body';
        }
        
        const info = {
            name: obj.name,
            type: objectType,
            diameter: extraParams.diameter_km ? `${extraParams.diameter_km.toLocaleString()} km` : (extraParams.diameter ? `${extraParams.diameter.toLocaleString()} km` : 'Unknown'),
            mass: extraParams.mass || 'Unknown',
            temperature: extraParams.temperature ? `${extraParams.temperature}°C` : extraParams.surface_temp ? `${extraParams.surface_temp}°C` : 'Unknown',
            gravity: extraParams.gravity ? `${extraParams.gravity} m/s²` : 'Unknown',
            obliquity: extraParams.obliquity ? `${extraParams.obliquity.toFixed(1)}°` : 'Unknown',
            rotationPeriod: extraParams.rotation_period ? `${extraParams.rotation_period.toFixed(2)} days` : 'Unknown',
            orbitalParams: {
                semiMajorAxis: orbitParams.a ? `${orbitParams.a.toFixed(3)} AU` : '0.000 AU',
                eccentricity: orbitParams.e ? orbitParams.e.toFixed(3) : '0.000',
                inclination: orbitParams.inc ? `${(orbitParams.inc * 180 / Math.PI).toFixed(3)}°` : '0.000°',
                longitudeOfNode: orbitParams.node ? `${(orbitParams.node * 180 / Math.PI).toFixed(3)}°` : '0.000°',
                argumentOfPerihelion: orbitParams.peri ? `${(orbitParams.peri * 180 / Math.PI).toFixed(3)}°` : '0.000°',
                meanAnomaly: orbitParams.ma ? `${(orbitParams.ma * 180 / Math.PI).toFixed(3)}°` : '0.000°',
                epoch: extraParams.epoch || (timeRef.current.MJD ? `${Math.round(timeRef.current.MJD)} (MJD)` : 'Unknown')
            },
            riskLevel: extraParams['PS max'] !== undefined ? extraParams['PS max'] : 'N/A'
        };
        
        return info;
    };

    const addSun = () => {
        try {
            console.log('addSun called, sceneRef.current:', sceneRef.current);
            const sunTextureLoader = new THREE.TextureLoader();
            const sunTexture = sunTextureLoader.load(`${import.meta.env.BASE_URL}assets/body_textures/8k_sun.jpg`);

            const geometry = new THREE.SphereGeometry(0.02, DEFAULT_MESH_N, DEFAULT_MESH_N);
            const material = new THREE.MeshBasicMaterial({map: sunTexture});
            const sunMesh = new THREE.Mesh(geometry, material);
            console.log('Sun mesh created:', sunMesh);
            
            if (sceneRef.current) {
                sceneRef.current.add(sunMesh);
                console.log('Sun added to scene');
            } else {
                console.error('sceneRef.current is null, cannot add sun to scene');
            }
            
            const sunTiltAxis = new THREE.Vector3(0, 0, 1).normalize();
            sunMesh.rotateOnAxis(sunTiltAxis, SUNOBLIQUITY * DEG_TO_RAD);

            console.log('Sun added successfully');
            return sunMesh;
        } catch (error) {
            console.error('Error adding sun:', error);
            // Fallback sun without texture
            const geometry = new THREE.SphereGeometry(0.02, DEFAULT_MESH_N, DEFAULT_MESH_N);
            const material = new THREE.MeshBasicMaterial({color: 0xffff00});
            const sunMesh = new THREE.Mesh(geometry, material);
            sceneRef.current.add(sunMesh);
            return sunMesh;
        }
    };

    const initializePlanets = async () => {
        const planets_json = await readJSON(`${import.meta.env.BASE_URL}assets/data/planet_data.json`);
        if (!planets_json) {
            console.error('Failed to load planet data');
            return;
        }
        
        for (const [planetName, planetData] of Object.entries(planets_json)) {
            const orbitParams = planetData.orbitParams;
            
            // Validate orbit parameters before processing
            if (!validateOrbitParams(orbitParams)) {
                console.warn(`Skipping planet ${planetName} due to invalid orbit parameters:`, orbitParams);
                continue;
            }
            
            // Create a copy to avoid mutating original data
            const processedOrbitParams = { ...orbitParams };
            processedOrbitParams.inc *= DEG_TO_RAD;
            processedOrbitParams.node *= DEG_TO_RAD;
            processedOrbitParams.peri *= DEG_TO_RAD;
            processedOrbitParams.ma *= DEG_TO_RAD;
            
            const planetTextureName = planetData.renderParams.texture;
            const planetTextureLoader = new THREE.TextureLoader();
            let planetTexture;
            
            try {
                planetTexture = planetTextureLoader.load(`${import.meta.env.BASE_URL}assets/body_textures/${planetTextureName}`);
            } catch (error) {
                console.warn(`Failed to load texture for ${planetName}:`, error);
                // Use a fallback color instead of texture
                planetTexture = null;
            }
            
            let mesh;
            if (planetName === 'rings') {
                const geometry = new THREE.RingGeometry(planetData.renderParams.innerRadius, planetData.renderParams.outerRadius, 64);
                const material = new THREE.MeshBasicMaterial({
                    map: planetTexture,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7,
                    color: planetTexture ? undefined : planetData.renderParams.color
                });
                mesh = new THREE.Mesh(geometry, material);
            } else {
                const geometry = new THREE.SphereGeometry(planetData.renderParams.radius, DEFAULT_MESH_N, DEFAULT_MESH_N);
                const material = new THREE.MeshBasicMaterial({
                    map: planetTexture,
                    color: planetTexture ? undefined : planetData.renderParams.color
                });
                mesh = new THREE.Mesh(geometry, material);
            }
            
            const orbit = createOrbitSafe(processedOrbitParams, planetData.renderParams.color, ORBIT_MESH_POINTS);
            if (!orbit) {
                console.warn(`Failed to create orbit for ${planetName}, skipping`);
                continue;
            }
            
            const pos = getOrbitPositionSafe(processedOrbitParams.a, processedOrbitParams.e, 0, processedOrbitParams.transformMatrix);
            mesh.position.set(pos.x, pos.y, pos.z);
            
            if (planetName === 'rings') {
                mesh.rotation.x = Math.PI/2; 
                if (planetData.extraParams.obliquity && isFinite(planetData.extraParams.obliquity)) {
                    mesh.rotation.y = planetData.extraParams.obliquity * DEG_TO_RAD;
                }
            } else {
                const rotationAxis = new THREE.Vector3(0, 0, 1).normalize();
                if (planetData.extraParams.obliquity && isFinite(planetData.extraParams.obliquity)) {
                    const planetObliquity = planetData.extraParams.obliquity * DEG_TO_RAD;
                    mesh.rotateOnAxis(rotationAxis, planetObliquity);
                }
            }

            // Update the orbit parameters in the data to the processed version
            planetData.orbitParams = processedOrbitParams;
            
            const body = new Body(planetName, planetData, orbit, mesh);
            orbit.userData.parent = body;
            mesh.userData.parent = body;
            dataRef.current.planets.push(body);
        }
    };

    const initializeNeos = async () => {
        const neos_json = await readJSON(`${import.meta.env.BASE_URL}assets/data/risk_list_neo_data.json`);
        if (!neos_json) {
            console.error('Failed to load NEO data');
            return;
        }
        
        let i = 0;
        for (const [neoName, neoData] of Object.entries(neos_json)) {
            const orbitParams = neoData.orbitParams;
            
            // Validate orbit parameters before processing
            if (!validateOrbitParams(orbitParams)) {
                console.warn(`Skipping NEO ${neoName} due to invalid orbit parameters:`, orbitParams);
                continue;
            }
            
            // Create a copy to avoid mutating original data
            const processedOrbitParams = { ...orbitParams };
            processedOrbitParams.inc *= DEG_TO_RAD;
            processedOrbitParams.node *= DEG_TO_RAD;
            processedOrbitParams.peri *= DEG_TO_RAD;
            processedOrbitParams.ma *= DEG_TO_RAD;

            const geometry = new THREE.SphereGeometry(NEO_RADIUS, DEFAULT_MESH_N / 2, DEFAULT_MESH_N / 2);
            const material = new THREE.MeshBasicMaterial({ color: NEO_COLOR });
            const neoMesh = new THREE.Mesh(geometry, material);

            const orbit = createOrbitSafe(processedOrbitParams, NEO_ORBIT_COLOR, ORBIT_MESH_POINTS);
            if (!orbit) {
                console.warn(`Failed to create orbit for NEO ${neoName}, skipping`);
                continue;
            }
            
            const pos = getOrbitPositionSafe(processedOrbitParams.a, processedOrbitParams.e, 0, processedOrbitParams.transformMatrix);
            neoMesh.position.set(pos.x, pos.y, pos.z);

            // Update the orbit parameters in the data to the processed version
            neoData.orbitParams = processedOrbitParams;

            const body = new Body(neoName, neoData, orbit, neoMesh);
            orbit.userData.parent = body;
            neoMesh.userData.parent = body;
            dataRef.current.neos.push(body);

            i += 1;
            if (i == MAX_VISIBLE_NEOS) { break; }
        }
    };

    const initializeShowers = async () => {
        const showers_json = await readJSON(`${import.meta.env.BASE_URL}assets/data/stream_dataIAU2022.json`);
        const parentBodies_json = await readJSON(`${import.meta.env.BASE_URL}assets/data/stream_parentbody.json`);
        
        if (!showers_json || !parentBodies_json) {
            console.error('Failed to load shower data');
            return;
        }
        
        const parentBodies = Object.entries(parentBodies_json);
        
        let visibleShowersCount = 0;

        for (const [showerName, showerData] of Object.entries(showers_json)) {
            if (visibleShowersCount === MAX_VISIBLE_SHOWERS) break;

            const orbitParams = showerData.orbitParams;
            const extraParams = showerData.extraParams;
            const code = extraParams.Code;

            // Validate orbit parameters before processing
            if (!validateOrbitParams(orbitParams)) {
                console.warn(`Skipping shower ${showerName} due to invalid orbit parameters:`, orbitParams);
                continue;
            }

            // Create a copy to avoid mutating original data
            const processedOrbitParams = { ...orbitParams };
            processedOrbitParams.inc *= DEG_TO_RAD;
            processedOrbitParams.node *= DEG_TO_RAD;
            processedOrbitParams.peri *= DEG_TO_RAD;

            const orbitMesh = createOrbitSafe(processedOrbitParams, SHOWER_ORBIT_COLOR, ORBIT_MESH_POINTS);
            if (!orbitMesh) {
                console.warn(`Failed to create orbit for shower ${showerName}, skipping`);
                continue;
            }
            
            // Update the orbit parameters in the data to the processed version
            showerData.orbitParams = processedOrbitParams;
            
            const body = new Body(showerName, showerData, orbitMesh, null);
            orbitMesh.userData.parent = body;

            let currentShower = dataRef.current.showers.find((shower) => shower.code === code);

            if (currentShower === undefined) {
                currentShower = new Shower(showerName, code, [orbitMesh], null, 'Unknown');
                dataRef.current.showers.push(currentShower);
                visibleShowersCount++;
            } else { 
                currentShower.orbitMeshes.push(orbitMesh); 
            }

            const parentBody = parentBodies.find(([pBodyName, pBodyData]) => pBodyData.extraParams.Code === code);

            if (parentBody && currentShower.parentBodyMesh === null) {
                const [parentBodyName, parentBodyData] = parentBody;
                const orbitParams_parent = parentBodyData.orbitParams;
                
                if (validateOrbitParams(orbitParams_parent)) {
                    // Create a copy to avoid mutating original data
                    const processedParentOrbitParams = { ...orbitParams_parent };
                    processedParentOrbitParams.inc *= DEG_TO_RAD;
                    processedParentOrbitParams.node *= DEG_TO_RAD;
                    processedParentOrbitParams.peri *= DEG_TO_RAD;
                    processedParentOrbitParams.ma *= DEG_TO_RAD;

                    const geometry = new THREE.SphereGeometry(NEO_RADIUS, DEFAULT_MESH_N, DEFAULT_MESH_N);
                    const material = new THREE.MeshBasicMaterial({ color: NEO_COLOR });
                    const parentMesh = new THREE.Mesh(geometry, material);

                    const parentOrbit = createOrbitSafe(processedParentOrbitParams, PARENT_ORBIT_COLOR, ORBIT_MESH_POINTS);
                    if (parentOrbit) {
                        // Update the orbit parameters in the data to the processed version
                        parentBodyData.orbitParams = processedParentOrbitParams;
                        
                        const body = new Body(parentBodyName, parentBodyData, parentOrbit, parentMesh);
                        parentOrbit.userData.parent = body;

                        const pos = getOrbitPositionSafe(processedParentOrbitParams.a, processedParentOrbitParams.e, 0, processedParentOrbitParams.transformMatrix);
                        parentMesh.position.set(pos.x, pos.y, pos.z);

                        currentShower.parentBodyMesh = parentMesh;
                        currentShower.parentBodyName = parentBodyName;
                        currentShower.orbitMeshes = [parentOrbit].concat(currentShower.orbitMeshes);
                    }
                }
            }
        }
    };

    const updateOrbits = (filterConditions) => {
        // Remove everything from the scene
        dataRef.current.planets.forEach(planet => {
            sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', planet.orbitMesh.uuid));
            sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', planet.bodyMesh.uuid));
        });
        
        dataRef.current.neos.forEach(neo => {
            sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', neo.orbitMesh.uuid));
            sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', neo.bodyMesh.uuid));
        });
        
        dataRef.current.showers.forEach(shower => {
            if (shower.parentBodyMesh != null)
                sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', shower.parentBodyMesh.uuid));
            shower.orbitMeshes.forEach(mesh => {
                if (mesh != undefined)
                    sceneRef.current.remove(sceneRef.current.getObjectByProperty('uuid', mesh.uuid));
            });
        });

        // Add filtered objects
        dataRef.current.planets.forEach(planet => {
            if (filterConditions.checkPassesFilters(planet)) {
                sceneRef.current.add(planet.orbitMesh);
                sceneRef.current.add(planet.bodyMesh);
            }
        });

        dataRef.current.neos.forEach(neo => {
            if (filterConditions.checkPassesFilters(neo)) {
                sceneRef.current.add(neo.orbitMesh);
                sceneRef.current.add(neo.bodyMesh);
            }
        });

        dataRef.current.showers.forEach(shower => {
            if ((filterConditions.shownTypes['Shower']) && (shower.parentBodyMesh != null) && (shower.parentBodyMesh != undefined))
                sceneRef.current.add(shower.parentBodyMesh);
            if (filterConditions.shownTypes['Shower']) {
                shower.orbitMeshes.forEach(mesh => {
                    sceneRef.current.add(mesh);
                });
            }
        });
    };

    const updateNEORiskColors = (collisionDetectionActive) => {
        dataRef.current.neos.forEach(neo => {
            if (neo.bodyMesh && neo.orbitMesh) {
                if (collisionDetectionActive) {
                    // Apply risk-based coloring
                    const psMax = neo.data.extraParams['PS max'] || -99;
                    const ipMax = neo.data.extraParams['IP max'] || 0;
                    
                    // Determine risk level and color for orbit only
                    let orbitColor = NEO_ORBIT_COLOR; // Default red
                    
                    if (psMax > -2.0 || ipMax > 0.01) {
                        // High risk - bright red
                        orbitColor = 0xff0000;
                    } else if (psMax > -3.0 || ipMax > 0.001) {
                        // Medium risk - yellow
                        orbitColor = 0xffff00;
                    } else if (psMax > -4.0 || ipMax > 0.0001) {
                        // Low risk - green
                        orbitColor = 0x00ff00;
                    }
                    
                    // Always keep body white, only change orbit color
                    neo.bodyMesh.material.color.setHex(NEO_COLOR);
                    neo.orbitMesh.material.color.setHex(orbitColor);
                } else {
                    // Reset to default colors
                    neo.bodyMesh.material.color.setHex(NEO_COLOR);
                    neo.orbitMesh.material.color.setHex(NEO_ORBIT_COLOR);
                }
            }
        });
    };

    // Initialize Three.js scene
    useEffect(() => {
        console.log('Orrery useEffect triggered, mountRef.current:', mountRef.current);
        if (!mountRef.current) {
            console.log('mountRef.current is null, returning early');
            return;
        }

        console.log('Creating Three.js scene...');
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: mountRef.current });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        // Add mouse event listeners
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('mouseup', handleMouseUp);

        // Load skybox texture
        try {
            scene.background = new THREE.CubeTextureLoader().load([
                `${import.meta.env.BASE_URL}assets/px.png`,
                `${import.meta.env.BASE_URL}assets/nx.png`,
                `${import.meta.env.BASE_URL}assets/py.png`,
                `${import.meta.env.BASE_URL}assets/ny.png`,
                `${import.meta.env.BASE_URL}assets/pz.png`,
                `${import.meta.env.BASE_URL}assets/nz.png`
            ]);
        } catch (error) {
            console.warn('Failed to load skybox, using black background:', error);
            scene.background = new THREE.Color(0x000000);
        }

        // Add lighting
        const light = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(light);

        // Create a group to hold collision prediction visuals
        predictionGroupRef.current = new THREE.Group();
        predictionGroupRef.current.visible = true;
        scene.add(predictionGroupRef.current);

        // Create a group to hold risk heatmap visuals
        heatmapGroupRef.current = new THREE.Group();
        heatmapGroupRef.current.visible = false;
        scene.add(heatmapGroupRef.current);

        // Setup controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.object.position.set(2, 2, 2);
        controls.target = new THREE.Vector3(0, 0, 0);
        controls.enableDamping = true;
        controlsRef.current = controls;

        // Initialize time
        timeRef.current.MJD = JDToMJD(timeRef.current.JD);

        // Initialize objects
        const initScene = async () => {
            try {
                console.log('Starting scene initialization...');
                setIsLoading(true);
                setError(null);
                
                console.log('Adding sun...');
                dataRef.current.sunMesh = addSun();
                console.log('Sun added:', dataRef.current.sunMesh);
                
                console.log('Initializing planets...');
                await initializePlanets();
                console.log('Planets initialized');
                
                console.log('Initializing NEOs...');
                await initializeNeos();
                console.log('NEOs initialized');
                
                console.log('Initializing showers...');
                await initializeShowers();
                console.log('Showers initialized');
                
                console.log('Updating orbits...');
                updateOrbits(filterConditions);
                console.log('Orbits updated');
                
                console.log('Scene initialization completed successfully');
                setIsLoading(false);
            } catch (error) {
                console.error('Error during scene initialization:', error);
                setError(error.message);
                // Add a simple fallback - just the sun
                console.log('Adding fallback sun...');
                dataRef.current.sunMesh = addSun();
                setIsLoading(false);
            }
        };

        initScene();

        // Listen for prediction toggle from CollisionDemo
        const handlePredictionToggle = (e) => {
            if (predictionGroupRef.current) {
                predictionGroupRef.current.visible = !!(e.detail && e.detail.show);
            }
        };
        window.addEventListener('collisionDemo:togglePredictions', handlePredictionToggle);

        // Listen for collision detection toggle
        const handleCollisionDetectionEvent = (e) => {
            const isActive = !!(e.detail && e.detail.active);
            handleCollisionDetectionToggle(isActive);
        };
        window.addEventListener('collisionDetection:toggle', handleCollisionDetectionEvent);

        // Listen for risk threshold changes
        const handleRiskThresholdEvent = (e) => {
            const threshold = e.detail && e.detail.threshold !== undefined ? e.detail.threshold : -2.0;
            const newFilterConditions = new FilterConditions();
            newFilterConditions.shownTypes = { ...filterConditions.shownTypes };
            newFilterConditions.collisionDetectionActive = filterConditions.collisionDetectionActive;
            newFilterConditions.setRiskThreshold(threshold);
            setFilterConditions(newFilterConditions);
            updateOrbits(newFilterConditions);
            updateNEORiskColors(filterConditions.collisionDetectionActive);
        };
        window.addEventListener('collisionDetection:riskThreshold', handleRiskThresholdEvent);

        // Heatmap: generate risk density grid using real NEO data
        const generateHeatmap = () => {
            if (!heatmapGroupRef.current) return;
            heatmapGroupRef.current.clear();

            // Load and process NEO risk data
            loadNEORiskData().then(neoData => {
                if (!neoData || !heatmapGroupRef.current) return;

                // Create 3D risk density grid
                const gridSize = 32; // 32x32x32 grid
                const gridSpacing = 0.1; // AU units
                const centerRadius = 1.0; // Earth's orbital radius
                const gridExtent = 0.3; // ±0.3 AU around Earth's orbit

                const riskGrid = new Array(gridSize).fill(null).map(() => 
                    new Array(gridSize).fill(null).map(() => new Array(gridSize).fill(0))
                );

                // Calculate risk density at each grid point
                for (let x = 0; x < gridSize; x++) {
                    for (let y = 0; y < gridSize; y++) {
                        for (let z = 0; z < gridSize; z++) {
                            const worldX = (x - gridSize/2) * gridSpacing;
                            const worldY = (y - gridSize/2) * gridSpacing;
                            const worldZ = (z - gridSize/2) * gridSpacing;
                            
                            const radius = Math.sqrt(worldX*worldX + worldY*worldY + worldZ*worldZ);
                            const theta = Math.atan2(worldY, worldX);
                            
                            // Only calculate risk for points near Earth's orbital plane
                            if (Math.abs(worldZ) < 0.05 && radius > 0.7 && radius < 1.3) {
                                riskGrid[x][y][z] = calculateRiskDensity(radius, theta, neoData);
                            }
                        }
                    }
                }

                // Create visual representation
                createRiskDensityVisualization(riskGrid, gridSize, gridSpacing);
            }).catch(error => {
                console.warn('Failed to load NEO data for heatmap, using fallback:', error);
                createFallbackHeatmap();
            });
        };

        const loadNEORiskData = async () => {
            try {
                // Use Vite public path to ensure correct asset loading
                const response = await fetch(`${import.meta.env.BASE_URL}assets/data/risk_list_neo_data.json`);
                if (!response.ok) throw new Error('Failed to load NEO data');
                return await response.json();
            } catch (error) {
                console.warn('Could not load NEO data:', error);
                return null;
            }
        };

        const calculateRiskDensity = (radius, theta, neoData) => {
            let totalRisk = 0;
            let count = 0;

            // Sample NEOs and calculate proximity-based risk
            Object.entries(neoData).slice(0, 100).forEach(([name, neo]) => {
                try {
                    const orbitParams = neo.orbitParams;
                    if (!orbitParams || !orbitParams.a || !orbitParams.e) return;

                    // Calculate NEO position at current time
                    const trueAnomaly = JulianDateToTrueAnomaly(orbitParams, timeRef.current.JD);
                    const transformMatrix = ensureTransformMatrix(orbitParams);
                    if (!transformMatrix) return;

                    const neoPos = getOrbitPositionSafe(orbitParams.a, orbitParams.e, trueAnomaly, transformMatrix);
                    if (!neoPos) return;

                    // Calculate distance from grid point to NEO
                    const dx = neoPos.x - radius * Math.cos(theta);
                    const dy = neoPos.y - radius * Math.sin(theta);
                    const dz = neoPos.z;
                    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

                    // Risk decreases with distance (inverse square law)
                    const proximityRisk = 1 / (1 + distance * 10);
                    
                    // Weight by NEO risk factors
                    const riskWeight = neo.extraParams?.['IP max'] || 0.001;
                    const sizeWeight = Math.log10(neo.extraParams?.diameter || 1) / 3;
                    
                    totalRisk += proximityRisk * riskWeight * (1 + sizeWeight);
                    count++;
                } catch (error) {
                    // Skip invalid NEOs
                }
            });

            return count > 0 ? totalRisk / count : 0;
        };

        const createRiskDensityVisualization = (riskGrid, gridSize, gridSpacing) => {
            const points = [];
            const colors = [];
            const sizes = [];

            // Find max risk for normalization
            let maxRisk = 0;
            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                    for (let z = 0; z < gridSize; z++) {
                        maxRisk = Math.max(maxRisk, riskGrid[x][y][z]);
                    }
                }
            }

            // Create points for significant risk areas
            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                    for (let z = 0; z < gridSize; z++) {
                        const risk = riskGrid[x][y][z];
                        if (risk > maxRisk * 0.1) { // Only show top 10% risk areas
                            const worldX = (x - gridSize/2) * gridSpacing;
                            const worldY = (y - gridSize/2) * gridSpacing;
                            const worldZ = (z - gridSize/2) * gridSpacing;
                            
                            points.push(worldX, worldZ, worldY);
                            
                            // Color based on risk level
                            const normalizedRisk = risk / maxRisk;
                            const rCol = Math.min(1.0, normalizedRisk * 2);
                            const gCol = Math.max(0.0, 1.0 - normalizedRisk);
                            const bCol = 0.0;
                            colors.push(rCol, gCol, bCol);
                            
                            // Size based on risk level
                            sizes.push(0.005 + normalizedRisk * 0.02);
                        }
                    }
                }
            }

            if (points.length > 0) {
                const geom = new THREE.BufferGeometry();
                geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

                const material = new THREE.PointsMaterial({ 
                    size: 0.01, 
                    vertexColors: true, 
                    transparent: true, 
                    opacity: 0.7,
                    sizeAttenuation: true
                });
                const cloud = new THREE.Points(geom, material);
                heatmapGroupRef.current.add(cloud);
            }
        };

        const createFallbackHeatmap = () => {
            // Fallback: simple ring around Earth's orbit
            const points = [];
            const colors = [];
            const numPoints = 2000;
            const innerR = 0.9;
            const outerR = 1.1;

            for (let i = 0; i < numPoints; i++) {
                const r = innerR + Math.random() * (outerR - innerR);
                const theta = Math.random() * Math.PI * 2;
                const z = (Math.random() - 0.5) * 0.1;
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                points.push(x, z, y);

                const proximity = 1 - Math.abs(r - 1) / (outerR - innerR);
                const rCol = 1.0;
                const gCol = 0.3 + 0.7 * proximity;
                const bCol = 0.0;
                colors.push(rCol, gCol, bCol);
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({ size: 0.008, vertexColors: true, transparent: true, opacity: 0.5 });
            const cloud = new THREE.Points(geom, material);
            heatmapGroupRef.current.add(cloud);
        };

        generateHeatmap();

        const handleHeatmapToggle = (e) => {
            if (heatmapGroupRef.current) {
                heatmapGroupRef.current.visible = !!(e.detail && e.detail.show);
            }
        };
        window.addEventListener('collisionDemo:toggleHeatmap', handleHeatmapToggle);

        // Animation loop
        const animate = (time) => {
            animationIdRef.current = requestAnimationFrame(animate);

            const deltaTime = time - (timeRef.current.lastFrameTime || 0);
            if (deltaTime < 16.67) return; // ~60 FPS
            timeRef.current.lastFrameTime = time;
            
            // Add logging to see if animation is running
            if (time % 1000 < 16.67) { // Log once per second
                console.log('Animation running, time:', time, 'renderer:', rendererRef.current);
            }

            let deltaJulian = deltaTime * TIMESPEEDS[timeRef.current.timeSpeedIndex] / 1000;
            
            // Validate time delta
            if (!isFinite(deltaJulian) || isNaN(deltaJulian)) {
                console.warn('Invalid time delta, skipping frame');
                return;
            }
            
            timeRef.current.JD += deltaJulian;
            timeRef.current.MJD += deltaJulian;

            // Update Sun rotation
            if (dataRef.current.sunMesh) {
                const sunRotationAxis = new THREE.Vector3(0, 1, 0).normalize();
                const rotationDelta = (2 * Math.PI/(60 * SUNROTPER)) * 1 * TIMESPEEDS[timeRef.current.timeSpeedIndex];
                if (isFinite(rotationDelta) && !isNaN(rotationDelta)) {
                    dataRef.current.sunMesh.rotateOnAxis(sunRotationAxis, rotationDelta);
                }
            }

            // Update planet positions and rotation
            dataRef.current.planets.forEach(planet => {
                try {
                    const orbitParams = planet.data.orbitParams;
                    const extraParams = planet.data.extraParams;
                    
                    // Validate time input for true anomaly calculation
                    if (!isFinite(timeRef.current.JD) || isNaN(timeRef.current.JD)) {
                        console.warn('Invalid Julian Date, skipping planet update');
                        return;
                    }
                    
                    const trueAnomaly = JulianDateToTrueAnomaly(orbitParams, timeRef.current.JD);
                    
                    // Validate true anomaly result
                    if (!isFinite(trueAnomaly) || isNaN(trueAnomaly)) {
                        console.warn(`Invalid true anomaly for planet ${planet.name}:`, trueAnomaly);
                        return;
                    }
                    
                    // Ensure transformMatrix exists
                    const transformMatrix = ensureTransformMatrix(orbitParams);
                    if (!transformMatrix) {
                        console.warn(`Failed to create transformMatrix for planet ${planet.name}, skipping position update`);
                        return;
                    }
                    
                    const pos = getOrbitPositionSafe(orbitParams.a, orbitParams.e, trueAnomaly, transformMatrix);
                    planet.setPosition(pos);
                    
                    // Update rotation for non-ring objects
                    if (planet.name !== 'rings' && extraParams.rotation_period && 
                        isFinite(extraParams.rotation_period) && extraParams.rotation_period > 0) {
                        const rotationAxis = new THREE.Vector3(0, 1, 0).normalize();
                        const planetRotationDelta = (2 * Math.PI/(60 * extraParams.rotation_period)) * 1 * TIMESPEEDS[timeRef.current.timeSpeedIndex];
                        if (isFinite(planetRotationDelta) && !isNaN(planetRotationDelta)) {
                            planet.bodyMesh.rotateOnAxis(rotationAxis, planetRotationDelta);
                        }
                    }
                } catch (error) {
                    console.error(`Error updating planet ${planet.name}:`, error);
                }
            });

            // Update NEO positions
            dataRef.current.neos.forEach(neo => {
                try {
                    const orbitParams = neo.data.orbitParams;
                    
                    // Validate time input
                    if (!isFinite(timeRef.current.MJD) || isNaN(timeRef.current.MJD)) {
                        console.warn('Invalid MJD, skipping NEO update');
                        return;
                    }
                    
                    const trueAnomaly = JulianDateToTrueAnomaly(orbitParams, timeRef.current.MJD);
                    
                    // Validate true anomaly result
                    if (!isFinite(trueAnomaly) || isNaN(trueAnomaly)) {
                        console.warn(`Invalid true anomaly for NEO ${neo.name}:`, trueAnomaly);
                        return;
                    }
                    
                    // Ensure transformMatrix exists
                    const transformMatrix = ensureTransformMatrix(orbitParams);
                    if (!transformMatrix) {
                        console.warn(`Failed to create transformMatrix for NEO ${neo.name}, skipping position update`);
                        return;
                    }
                    
                    const pos = getOrbitPositionSafe(orbitParams.a, orbitParams.e, trueAnomaly, transformMatrix);
                    neo.setPosition(pos);
                } catch (error) {
                    console.error(`Error updating NEO ${neo.name}:`, error);
                }
            });

            // Update shower visibility
            const earthPlanet = dataRef.current.planets.find(p => p.name === 'Earth');
            if (earthPlanet) {
                try {
                    const earthOrbitParams = earthPlanet.data.orbitParams;
                    const earthTrueAnomaly = JulianDateToTrueAnomaly(earthOrbitParams, timeRef.current.JD);

                    if (isFinite(earthTrueAnomaly) && !isNaN(earthTrueAnomaly)) {
                        dataRef.current.showers.forEach(shower => {
                            try {
                                if (filterConditions.shownTypes['Shower']) {
                                    if (shower.parentBodyMesh && shower.orbitMeshes[0]) {
                                        const parentOrbitParams = shower.orbitMeshes[0].userData.parent.data.orbitParams;
                                        if (parentOrbitParams) {
                                            const parentTrueAnomaly = JulianDateToTrueAnomaly(parentOrbitParams, timeRef.current.JD);
                                            if (isFinite(parentTrueAnomaly) && !isNaN(parentTrueAnomaly)) {
                                                // Ensure transformMatrix exists
                                                const parentTransformMatrix = ensureTransformMatrix(parentOrbitParams);
                                                if (parentTransformMatrix) {
                                                    const parentPos = getOrbitPositionSafe(parentOrbitParams.a, parentOrbitParams.e, parentTrueAnomaly, parentTransformMatrix);
                                                    shower.setPosition(parentPos);
                                                } else {
                                                    console.warn(`Failed to create transformMatrix for shower parent body, skipping position update`);
                                                }
                                            }
                                        }
                                    }

                                    shower.orbitMeshes.forEach(orbMesh => {
                                        try {
                                            const extraParams = orbMesh.userData.parent.data.extraParams;
                                            const streamAnomalyBegin = extraParams.true_anomaly_begin;
                                            const streamAnomalyEnd = extraParams.true_anomaly_end;

                                            // Validate stream anomaly values
                                            if (isFinite(streamAnomalyBegin) && isFinite(streamAnomalyEnd) && 
                                                !isNaN(streamAnomalyBegin) && !isNaN(streamAnomalyEnd)) {
                                                
                                                if (isEarthInStreamRange(earthTrueAnomaly * 180 / Math.PI, streamAnomalyBegin, streamAnomalyEnd)) {
                                                    orbMesh.material.color.set(SHOWER_ORBIT_COLOR);
                                                    orbMesh.material.transparent = false;
                                                    orbMesh.material.opacity = 1;
                                                    orbMesh.raycast = THREE.Mesh.prototype.raycast;
                                                } else if (orbMesh.material.color.getHex() === SHOWER_ORBIT_COLOR) {
                                                    orbMesh.material.color.set(SHOWER_ORBIT_COLOR_NOTVIS);
                                                    orbMesh.material.transparent = true;
                                                    orbMesh.material.opacity = 0.05;
                                                    orbMesh.raycast = function() {};
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error updating shower orbit mesh:', error);
                                        }
                                    });
                                }
                            } catch (error) {
                                console.error(`Error updating shower ${shower.name}:`, error);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error updating showers:', error);
                }
            }

            // Update time display
            try {
                const timeString = MJDToDatetime(timeRef.current.MJD);
                if (timeString && timeString !== 'Invalid Date') {
                    setCurrentTime('Date: ' + timeString + ' UTC');
                }
                
                if (timeRef.current.timeSpeedIndex == 10) {
                    setTimeSpeed('Speed: 1 day/second');
                } else if (timeRef.current.timeSpeedIndex == 7) {
                    setTimeSpeed('Speed: Real-time');
                } else {
                    const speed = TIMESPEEDS[timeRef.current.timeSpeedIndex];
                    if (isFinite(speed) && !isNaN(speed)) {
                        setTimeSpeed(`Speed: ${speed.toPrecision(3)} days/second`);
                    }
                }
            } catch (error) {
                console.error('Error updating time display:', error);
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate(0);

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('collisionDemo:togglePredictions', handlePredictionToggle);
            window.removeEventListener('collisionDemo:toggleHeatmap', handleHeatmapToggle);
            window.removeEventListener('collisionDetection:toggle', handleCollisionDetectionEvent);
            window.removeEventListener('collisionDetection:riskThreshold', handleRiskThresholdEvent);
            renderer.domElement.removeEventListener('mousedown', handleMouseDown);
            renderer.domElement.removeEventListener('mousemove', handleMouseMove);
            renderer.domElement.removeEventListener('mouseup', handleMouseUp);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (controlsRef.current) {
                controlsRef.current.dispose();
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, []);

    const handleTimeControl = (action) => {
        switch (action) {
            case 'fastbackward':
                if (timeRef.current.timeSpeedIndex > 0) timeRef.current.timeSpeedIndex -= 1;
                break;
            case 'backward':
                timeRef.current.timeSpeedIndex = 6;
                break;
            case 'now':
                timeRef.current.timeSpeedIndex = 7;
                const currentJD = (Date.now() / 86400000) + 2440587.5;
                if (isFinite(currentJD) && !isNaN(currentJD)) {
                    timeRef.current.JD = currentJD;
                    timeRef.current.MJD = JDToMJD(currentJD);
                }
                break;
            case 'forward':
                timeRef.current.timeSpeedIndex = 7;
                break;
            case 'fastforward':
                if (timeRef.current.timeSpeedIndex < TIMESPEEDS.length - 1) timeRef.current.timeSpeedIndex += 1;
                break;
        }
    };

    const handleFilterChange = (type, value) => {
        const newFilterConditions = new FilterConditions();
        newFilterConditions.shownTypes = { ...filterConditions.shownTypes };
        newFilterConditions.shownTypes[type] = value;
        newFilterConditions.collisionDetectionActive = filterConditions.collisionDetectionActive;
        newFilterConditions.riskThreshold = filterConditions.riskThreshold;
        setFilterConditions(newFilterConditions);
        updateOrbits(newFilterConditions);
    };

    const handleCollisionDetectionToggle = (active) => {
        const newFilterConditions = new FilterConditions();
        newFilterConditions.shownTypes = { ...filterConditions.shownTypes };
        newFilterConditions.setCollisionDetectionMode(active);
        newFilterConditions.riskThreshold = filterConditions.riskThreshold;
        setFilterConditions(newFilterConditions);
        updateOrbits(newFilterConditions);
        updateNEORiskColors(active);
    };

    // Format the selected object data for display
    const objectInfo = selectedObject ? formatObjectInfo(selectedObject) : null;

    return (
        <div className="orrery-container">
            <canvas ref={mountRef} className="orrery-canvas" />
            
            {/* Selected Object Name Display */}
            {selectedObjectName && (
                <div className="object-name-display">
                    {selectedObjectName}
                </div>
            )}
            
            {/* Loading State */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading Solar System...</p>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="error-overlay">
                    <h3>Error Loading Orrery</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}
            
            {/* Time Controls */}
            <div className="time-controls">
                <div className="time-display">
                    <div className="time-item">
                        <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                        </svg>
                        <span>{currentTime}</span>
                    </div>
                    <div className="time-item">
                        <svg className="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        <span>{timeSpeed}</span>
                    </div>
                </div>
                <div className="time-buttons">
                    <button onClick={() => handleTimeControl('fastbackward')} className="time-btn" title="Fast Rewind">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11,19 2,12 11,5"/>
                            <polygon points="22,19 13,12 22,5"/>
                        </svg>
                    </button>
                    <button onClick={() => handleTimeControl('backward')} className="time-btn" title="Step Backward">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="19,20 9,12 19,4"/>
                        </svg>
                    </button>
                    <button onClick={() => handleTimeControl('now')} className="time-btn" title="Reset to Now">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="16" y1="12" x2="12" y2="12"/>
                        </svg>
                    </button>
                    <button onClick={() => handleTimeControl('forward')} className="time-btn" title="Step Forward">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5,4 15,12 5,20"/>
                        </svg>
                    </button>
                    <button onClick={() => handleTimeControl('fastforward')} className="time-btn" title="Fast Forward">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13,19 22,12 13,5"/>
                            <polygon points="2,19 11,12 2,5"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="filter-panel">
                <h3>Filters</h3>
                <label>
                    <input 
                        type="checkbox" 
                        checked={filterConditions.shownTypes['Planet']}
                        onChange={(e) => handleFilterChange('Planet', e.target.checked)}
                    />
                    Planets
                </label>
                <label>
                    <input 
                        type="checkbox" 
                        checked={filterConditions.shownTypes['Dwarf planet']}
                        onChange={(e) => handleFilterChange('Dwarf planet', e.target.checked)}
                    />
                    Dwarf planets
                </label>
                <label>
                    <input 
                        type="checkbox" 
                        checked={filterConditions.shownTypes['NEO']}
                        onChange={(e) => handleFilterChange('NEO', e.target.checked)}
                    />
                    Near-Earth objects
                </label>
                <label>
                    <input 
                        type="checkbox" 
                        checked={filterConditions.shownTypes['Shower']}
                        onChange={(e) => handleFilterChange('Shower', e.target.checked)}
                    />
                    Meteor showers
                </label>
                <label>
                    <input 
                        type="checkbox" 
                        checked={filterConditions.shownTypes['Sporadic']}
                        onChange={(e) => handleFilterChange('Sporadic', e.target.checked)}
                    />
                    Sporadic meteoroids
                </label>
            </div>

            {/* Info Panel - Enhanced with detailed information */}
            {objectInfo && (
                <div className="info-panel">
                    <h2>{objectInfo.name}</h2>
                    <p><span>Type:</span> {objectInfo.type}</p>
                    <p><span>Diameter:</span> {objectInfo.diameter}</p>
                    {objectInfo.mass !== 'Unknown' && <p><span>Mass:</span> {objectInfo.mass}</p>}
                    {objectInfo.temperature !== 'Unknown' && <p><span>Average temperature:</span> {objectInfo.temperature}</p>}
                    {objectInfo.gravity !== 'Unknown' && <p><span>Surface gravity:</span> {objectInfo.gravity}</p>}
                    {objectInfo.obliquity !== 'Unknown' && <p><span>Obliquity (axial tilt):</span> {objectInfo.obliquity}</p>}
                    {objectInfo.rotationPeriod !== 'Unknown' && <p><span>Rotation period:</span> {objectInfo.rotationPeriod}</p>}
                    
                    <h3>Orbital parameters:</h3>
                    <p><span>Semi-major axis:</span> {objectInfo.orbitalParams.semiMajorAxis}</p>
                    <p><span>Eccentricity:</span> {objectInfo.orbitalParams.eccentricity}</p>
                    <p><span>Inclination:</span> {objectInfo.orbitalParams.inclination}</p>
                    <p><span>Longitude of ascending node:</span> {objectInfo.orbitalParams.longitudeOfNode}</p>
                    <p><span>Argument of perihelion:</span> {objectInfo.orbitalParams.argumentOfPerihelion}</p>
                    <p><span>Mean anomaly:</span> {objectInfo.orbitalParams.meanAnomaly}</p>
                    <p><span>Epoch:</span> {objectInfo.orbitalParams.epoch}</p>
                    
                    {objectInfo.riskLevel !== 'N/A' && (
                        <p><span>Risk Level:</span> {objectInfo.riskLevel}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orrery;