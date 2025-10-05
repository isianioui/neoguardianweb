import React from 'react';
import { Shield, Satellite, AlertTriangle, Activity, Database, Globe } from 'lucide-react';
import './TechnologySection.css';

const TechnologySection = () => {
  return (
    <section id="technology" className="technology-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Advanced Technology Stack</h2>
          <p className="section-subtitle">
            Powered by cutting-edge algorithms and real-time data processing
          </p>
        </div>
        <div className="tech-content">
          <div className="tech-diagram">
            <div className="orbit-container">
              <div className="earth"></div>
              <div className="orbit orbit-1">
                <div className="satellite-dot sat-1"></div>
              </div>
              <div className="orbit orbit-2">
                <div className="satellite-dot sat-2"></div>
              </div>
              <div className="orbit orbit-3">
                <div className="satellite-dot sat-3"></div>
              </div>
              <div className="collision-alert"></div>
            </div>
          </div>
          <div className="tech-info">
            <div className="tech-feature">
              <Shield className="tech-icon" />
              <div>
                <h3>Real-time Processing</h3>
                <p>Processing over 100,000 data points per second from global tracking networks</p>
              </div>
            </div>
            <div className="tech-feature">
              <AlertTriangle className="tech-icon" />
              <div>
                <h3>Conjunction Assessment</h3>
                <p>Automated screening and ranking of close-approach events with risk scoring</p>
              </div>
            </div>
           
            
            <div className="tech-feature">
              <Globe className="tech-icon" />
              <div>
                <h3>3D Orbit Visualization</h3>
                <p>Interactive WebGL rendering of orbits, passes, and conjunction geometries</p>
              </div>
            </div>
            <div className="tech-feature">
              <Satellite className="tech-icon" />
              <div>
                <h3>Global Coverage</h3>
                <p>Monitoring satellites across all orbital altitudes and inclinations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;