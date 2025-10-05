import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './RiskHeatmap.css';

const RiskHeatmap = ({ collisionService, scene, camera }) => {
    const [heatmapData, setHeatmapData] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [opacity, setOpacity] = useState(0.3);
    const [resolution, setResolution] = useState(32);
    const heatmapGroupRef = useRef(null);
    const heatmapTextureRef = useRef(null);

    useEffect(() => {
        if (!collisionService || !scene) return;

        const handleUpdate = (update) => {
            if (update.type === 'risk_assessment') {
                updateHeatmap(update.data);
            }
        };

        collisionService.addCallback(handleUpdate);

        // Initialize heatmap group
        if (!heatmapGroupRef.current) {
            heatmapGroupRef.current = new THREE.Group();
            scene.add(heatmapGroupRef.current);
        }

        return () => {
            collisionService.removeCallback(handleUpdate);
            if (heatmapGroupRef.current && scene) {
                scene.remove(heatmapGroupRef.current);
            }
        };
    }, [collisionService, scene]);

    const updateHeatmap = (riskData) => {
        if (!riskData.predictions) return;

        // Process risk data into heatmap grid
        const gridSize = resolution;
        const grid = new Array(gridSize).fill(null).map(() => 
            new Array(gridSize).fill(0)
        );

        // Map risk predictions to grid
        riskData.predictions.forEach(prediction => {
            if (prediction.prediction.riskCategory === 'High' || 
                prediction.prediction.riskCategory === 'Medium') {
                
                // Convert 3D position to grid coordinates
                const gridPos = worldToGrid(prediction.prediction.minimumDistance || 1000);
                if (gridPos.x >= 0 && gridPos.x < gridSize && 
                    gridPos.y >= 0 && gridPos.y < gridSize) {
                    
                    const riskValue = prediction.prediction.collisionProbability;
                    grid[gridPos.x][gridPos.y] = Math.max(
                        grid[gridPos.x][gridPos.y], 
                        riskValue
                    );
                }
            }
        });

        setHeatmapData(grid);
        createHeatmapVisualization(grid);
    };

    const worldToGrid = (distance) => {
        // Convert world distance to grid coordinates
        // This is a simplified mapping - in reality, you'd use proper 3D to 2D projection
        const normalizedDistance = Math.min(distance / 10000, 1); // Normalize to 0-1
        const gridX = Math.floor(normalizedDistance * resolution);
        const gridY = Math.floor(Math.random() * resolution); // Simplified for demo
        
        return { x: gridX, y: gridY };
    };

    const createHeatmapVisualization = (grid) => {
        if (!heatmapGroupRef.current) return;

        // Clear existing heatmap
        heatmapGroupRef.current.clear();

        // Create heatmap texture
        const texture = createHeatmapTexture(grid);
        heatmapTextureRef.current = texture;

        // Create heatmap plane
        const geometry = new THREE.PlaneGeometry(20, 20, resolution - 1, resolution - 1);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide
        });

        const heatmapPlane = new THREE.Mesh(geometry, material);
        heatmapPlane.rotation.x = -Math.PI / 2; // Lay flat
        heatmapPlane.position.y = -5; // Position below Earth
        
        heatmapGroupRef.current.add(heatmapPlane);

        // Add risk indicators
        addRiskIndicators(grid);
    };

    const createHeatmapTexture = (grid) => {
        const size = resolution;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create gradient for heatmap
        const gradient = ctx.createLinearGradient(0, 0, size, 0);
        gradient.addColorStop(0, '#0000ff'); // Blue (low risk)
        gradient.addColorStop(0.5, '#ffff00'); // Yellow (medium risk)
        gradient.addColorStop(1, '#ff0000'); // Red (high risk)

        // Draw heatmap
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const riskValue = grid[x][y];
                if (riskValue > 0) {
                    const intensity = Math.min(riskValue * 1000, 1); // Scale for visibility
                    const color = getHeatmapColor(intensity);
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    const getHeatmapColor = (intensity) => {
        // Convert intensity (0-1) to heatmap color
        if (intensity < 0.33) {
            // Blue to Green
            const t = intensity / 0.33;
            const r = Math.floor(0);
            const g = Math.floor(255 * t);
            const b = Math.floor(255 * (1 - t));
            return `rgb(${r}, ${g}, ${b})`;
        } else if (intensity < 0.66) {
            // Green to Yellow
            const t = (intensity - 0.33) / 0.33;
            const r = Math.floor(255 * t);
            const g = 255;
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Yellow to Red
            const t = (intensity - 0.66) / 0.34;
            const r = 255;
            const g = Math.floor(255 * (1 - t));
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        }
    };

    const addRiskIndicators = (grid) => {
        const size = resolution;
        
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const riskValue = grid[x][y];
                if (riskValue > 0.01) { // Only show significant risks
                    const indicator = createRiskIndicator(riskValue, x, y);
                    heatmapGroupRef.current.add(indicator);
                }
            }
        }
    };

    const createRiskIndicator = (riskValue, x, y) => {
        const intensity = Math.min(riskValue * 1000, 1);
        const size = 0.1 + intensity * 0.2;
        
        const geometry = new THREE.SphereGeometry(size, 8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: getHeatmapColor(intensity),
            transparent: true,
            opacity: 0.6
        });

        const indicator = new THREE.Mesh(geometry, material);
        
        // Position indicator on the heatmap
        const gridX = (x / resolution) * 20 - 10;
        const gridZ = (y / resolution) * 20 - 10;
        indicator.position.set(gridX, -4.9, gridZ);
        
        // Add pulsing animation
        const pulse = () => {
            const scale = 1 + Math.sin(Date.now() * 0.003 + x + y) * 0.3;
            indicator.scale.setScalar(scale);
        };
        
        const animate = () => {
            pulse();
            requestAnimationFrame(animate);
        };
        animate();

        return indicator;
    };

    const handleOpacityChange = (newOpacity) => {
        setOpacity(newOpacity);
        if (heatmapGroupRef.current) {
            heatmapGroupRef.current.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = newOpacity;
                }
            });
        }
    };

    const handleResolutionChange = (newResolution) => {
        setResolution(newResolution);
        // Trigger heatmap regeneration
        if (collisionService) {
            collisionService.performRiskAssessment();
        }
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
        if (heatmapGroupRef.current) {
            heatmapGroupRef.current.visible = !isVisible;
        }
    };

    return (
        <div className="risk-heatmap">
            <div className="heatmap-controls">
                <div className="control-group">
                    <label>Show Heatmap:</label>
                    <button
                        className={`toggle-btn ${isVisible ? 'active' : ''}`}
                        onClick={toggleVisibility}
                    >
                        {isVisible ? 'Hide' : 'Show'}
                    </button>
                </div>
                
                {isVisible && (
                    <>
                        <div className="control-group">
                            <label>Opacity:</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={opacity}
                                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                                className="opacity-slider"
                            />
                            <span className="value">{opacity.toFixed(1)}</span>
                        </div>
                        
                        <div className="control-group">
                            <label>Resolution:</label>
                            <select
                                value={resolution}
                                onChange={(e) => handleResolutionChange(parseInt(e.target.value))}
                                className="resolution-select"
                            >
                                <option value="16">16x16</option>
                                <option value="32">32x32</option>
                                <option value="64">64x64</option>
                            </select>
                        </div>
                    </>
                )}
            </div>

            {isVisible && (
                <div className="heatmap-legend">
                    <h4>Risk Legend</h4>
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="legend-color low-risk"></div>
                            <span>Low Risk</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color medium-risk"></div>
                            <span>Medium Risk</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color high-risk"></div>
                            <span>High Risk</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskHeatmap;

