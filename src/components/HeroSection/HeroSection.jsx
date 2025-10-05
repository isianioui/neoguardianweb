import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/orrery');
  };

  return (
    <section id="home" className="hero-section">
      <div className="stars"></div>
      <div className="hero-content">
        <div className="celestial-objects">
          <div className="planet planet-1"></div>
          <div className="planet planet-2"></div>
          <div className="satellite satellite-1"></div>
        </div>
        <div className="hero-text">
          <h1 className="hero-title">Monitoring Space to Protect Earth</h1>
          <p className="hero-subtitle">Real-time satellite tracking and collision detection alerts</p>
          <button className="cta-button" onClick={handleExploreClick}>
            <Zap className="cta-icon" />
            Explore Space
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;