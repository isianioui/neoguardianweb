import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './PredictionOverlay.css';

const PredictionOverlay = ({ collisionService, scene, camera, renderer }) => {
    const [predictions, setPredictions] = useState([]);
    const [selectedPrediction, setSelectedPrediction] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [timeHorizon, setTimeHorizon] = useState(30); // days
    const predictionGroupRef = useRef(null);

    useEffect(() => {
        if (!collisionService || !scene) return;

        const handleUpdate = (update) => {
            if (update.type === 'risk_assessment') {
                updatePredictions(update.data);
            }
        };

        collisionService.addCallback(handleUpdate);

        // Initialize prediction group
        if (!predictionGroupRef.current) {
            predictionGroupRef.current = new THREE.Group();
            scene.add(predictionGroupRef.current);
        }

        return () => {
            collisionService.removeCallback(handleUpdate);
            if (predictionGroupRef.current && scene) {
                scene.remove(predictionGroupRef.current);
            }
        };
    }, [collisionService, scene]);

    const updatePredictions = async (riskData) => {
        if (!riskData.predictions) return;

        const newPredictions = [];
        
        for (const risk of riskData.predictions) {
            if (risk.prediction.riskCategory === 'High' || risk.prediction.riskCategory === 'Medium') {
                try {
                    const trajectory = await collisionService.getTrajectoryPrediction(risk.object1, 100);
                    if (trajectory) {
                        newPredictions.push({
                            ...risk,
                            trajectory: trajectory.trajectory
                        });
                    }
                } catch (error) {
                    console.error('Error getting trajectory prediction:', error);
                }
            }
        }

        setPredictions(newPredictions);
        updateVisualization(newPredictions);
    };

    const updateVisualization = (newPredictions) => {
        if (!predictionGroupRef.current) return;

        // Clear existing predictions
        predictionGroupRef.current.clear();

        newPredictions.forEach((prediction, index) => {
            createPredictionVisualization(prediction, index);
        });
    };

    const createPredictionVisualization = (prediction, index) => {
        if (!prediction.trajectory || !prediction.trajectory.positions) return;

        const positions = prediction.trajectory.positions;
        if (positions.length < 2) return;

        // Create trajectory line
        const geometry = new THREE.BufferGeometry().setFromPoints(
            positions.map(pos => new THREE.Vector3(pos.x, pos.y, pos.z))
        );

        const material = new THREE.LineBasicMaterial({
            color: getRiskColor(prediction.prediction.riskCategory),
            opacity: 0.7,
            transparent: true
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { prediction, type: 'trajectory' };
        predictionGroupRef.current.add(line);

        // Create risk indicators along the trajectory
        const step = Math.max(1, Math.floor(positions.length / 10));
        for (let i = 0; i < positions.length; i += step) {
            const position = positions[i];
            const riskIndicator = createRiskIndicator(position, prediction.prediction.riskCategory);
            riskIndicator.userData = { prediction, type: 'risk_indicator', index: i };
            predictionGroupRef.current.add(riskIndicator);
        }

        // Create collision probability cone
        if (prediction.prediction.collisionProbability > 0.01) {
            const cone = createCollisionCone(prediction);
            cone.userData = { prediction, type: 'collision_cone' };
            predictionGroupRef.current.add(cone);
        }
    };

    const createRiskIndicator = (position, riskCategory) => {
        const geometry = new THREE.SphereGeometry(0.02, 8, 6);
        const material = new THREE.MeshBasicMaterial({
            color: getRiskColor(riskCategory),
            transparent: true,
            opacity: 0.6
        });

        const indicator = new THREE.Mesh(geometry, material);
        indicator.position.set(position.x, position.y, position.z);
        
        // Add pulsing animation
        const pulse = () => {
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.3;
            indicator.scale.setScalar(scale);
        };
        
        const animate = () => {
            pulse();
            requestAnimationFrame(animate);
        };
        animate();

        return indicator;
    };

    const createCollisionCone = (prediction) => {
        const coneGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.3
        });

        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        
        // Position cone at the predicted collision point
        if (prediction.trajectory.positions.length > 0) {
            const lastPosition = prediction.trajectory.positions[prediction.trajectory.positions.length - 1];
            cone.position.set(lastPosition.x, lastPosition.y, lastPosition.z);
        }

        return cone;
    };

    const getRiskColor = (riskCategory) => {
        switch (riskCategory) {
            case 'High': return 0xff4444;
            case 'Medium': return 0xffaa00;
            case 'Low': return 0x44ff44;
            default: return 0x666666;
        }
    };

    const handlePredictionClick = (prediction) => {
        setSelectedPrediction(prediction);
        setIsVisible(true);
    };

    const closePredictionDetails = () => {
        setSelectedPrediction(null);
        setIsVisible(false);
    };

    const updateTimeHorizon = (newHorizon) => {
        setTimeHorizon(newHorizon);
        // Trigger new predictions with updated time horizon
        if (collisionService) {
            collisionService.performRiskAssessment();
        }
    };

    return (
        <div className="prediction-overlay">
            {/* Control Panel */}
            <div className="prediction-controls">
                <div className="control-group">
                    <label>Time Horizon (days):</label>
                    <input
                        type="range"
                        min="1"
                        max="365"
                        value={timeHorizon}
                        onChange={(e) => updateTimeHorizon(parseInt(e.target.value))}
                        className="time-slider"
                    />
                    <span className="time-value">{timeHorizon}</span>
                </div>
                <div className="control-group">
                    <button
                        className={`toggle-btn ${isVisible ? 'active' : ''}`}
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? 'Hide' : 'Show'} Predictions
                    </button>
                </div>
            </div>

            {/* Prediction Details Panel */}
            {isVisible && selectedPrediction && (
                <div className="prediction-details">
                    <div className="details-header">
                        <h3>Prediction Details</h3>
                        <button className="close-btn" onClick={closePredictionDetails}>
                            ×
                        </button>
                    </div>
                    <div className="details-content">
                        <div className="prediction-info">
                            <div className="info-row">
                                <span className="label">Objects:</span>
                                <span className="value">
                                    {selectedPrediction.object1} vs {selectedPrediction.object2}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Risk Category:</span>
                                <span className={`value risk-${selectedPrediction.prediction.riskCategory.toLowerCase()}`}>
                                    {selectedPrediction.prediction.riskCategory}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Collision Probability:</span>
                                <span className="value">
                                    {(selectedPrediction.prediction.collisionProbability * 100).toFixed(4)}%
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Confidence:</span>
                                <span className="value">
                                    {(selectedPrediction.prediction.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Minimum Distance:</span>
                                <span className="value">
                                    {selectedPrediction.prediction.minimumDistance?.toFixed(0)} km
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="label">Time to Closest Approach:</span>
                                <span className="value">
                                    {selectedPrediction.prediction.timeToClosestApproach?.toFixed(1)} days
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prediction List */}
            {isVisible && (
                <div className="prediction-list">
                    <h4>Active Predictions ({predictions.length})</h4>
                    {predictions.map((prediction, index) => (
                        <div
                            key={index}
                            className={`prediction-item ${selectedPrediction === prediction ? 'selected' : ''}`}
                            onClick={() => handlePredictionClick(prediction)}
                        >
                            <div className="prediction-header">
                                <span className="risk-category">
                                    {prediction.prediction.riskCategory}
                                </span>
                                <span className="probability">
                                    {(prediction.prediction.collisionProbability * 100).toFixed(4)}%
                                </span>
                            </div>
                            <div className="prediction-objects">
                                {prediction.object1} vs {prediction.object2}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PredictionOverlay;

