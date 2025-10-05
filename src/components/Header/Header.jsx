import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExploreClick = () => {
    navigate('/orrery');
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Rocket className="logo-icon" />
          <span className="logo-text">NeoGuardian</span>
        </div>
        <nav className="nav">
          <button onClick={() => scrollToSection('home')} className="nav-link">Home</button>
          <button onClick={() => scrollToSection('technology')} className="nav-link">Technology</button>
          <button onClick={() => scrollToSection('contact')} className="nav-link">Contact</button>
          <button onClick={handleExploreClick} className="nav-link explore-btn">Explore</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;