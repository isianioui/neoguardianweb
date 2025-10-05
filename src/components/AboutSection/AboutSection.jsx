import React from 'react';
import { Satellite, Target, Smartphone, Globe, AlertTriangle, Activity, Map } from 'lucide-react';
import './AboutSection.css';

const AboutSection = () => {
  const features = [
    {
      icon: <Satellite />,
      title: "Satellite Tracking",
      description: "Real-time monitoring of thousands of satellites in orbit"
    },
    {
      icon: <Target />,
      title: "Collision Prediction",
      description: "Advanced algorithms predict potential space debris collisions"
    },
    {
      icon: <Smartphone />,
      title: "Instant Mobile Alerts",
      description: "Get notified immediately of any potential threats"
    },
    {
      icon: <AlertTriangle />,
      title: "NEO Risk Watchlist",
      description: "Continuously tracks hazardous near‑Earth objects and risk levels"
    },
    {
      icon: <Globe />,
      title: "Global Orbit Visualization",
      description: "Interactive 3D views of satellite and NEO trajectories around Earth"
    },
    {
      icon: <Map />,
      title: "Ground Track Maps",
      description: "See upcoming passes, footprints, and corridor projections on Earth maps"
    },
    {
      icon: <Activity />,
      title: "Live Telemetry",
      description: "Stream real‑time orbital changes, conjunction updates, and status signals"
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Protecting Our Planet</h2>
          <p className="section-subtitle">
            NeoGuardian is an advanced space monitoring system designed to track satellites, 
            predict collisions, and protect critical space infrastructure that keeps our world connected.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;