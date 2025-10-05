import React from 'react';
import { Github, Twitter, Linkedin, Rocket } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <Rocket className="logo-icon" />
              <span className="logo-text">NeoGuardian</span>
            </div>
            <p className="footer-description">
              Monitoring space to protect Earth through advanced satellite tracking and collision detection technology.
            </p>
            <div className="social-links">
              <a href="https://github.com/isianioui" className="social-link" aria-label="GitHub">
                <Github />
              </a>
             
              <a href="https://www.linkedin.com/in/doha-isianioui-1b9009302/" className="social-link" aria-label="LinkedIn">
                <Linkedin />
              </a>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4 className="link-title">Navigation</h4>
              <ul className="links">
                <li><button onClick={() => scrollToSection('home')} className="footer-link">Home</button></li>
                <li><button onClick={() => scrollToSection('about')} className="footer-link">About</button></li>
                <li><button onClick={() => scrollToSection('technology')} className="footer-link">Technology</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="footer-link">Contact</button></li>
              </ul>
            </div>
            
            <div className="link-group">
              <h4 className="link-title">Services</h4>
              <ul className="links">
                <li><a href="#" className="footer-link">Satellite Tracking</a></li>
                <li><a href="#" className="footer-link">Collision Detection</a></li>
                <li><a href="#" className="footer-link">Risk Assessment</a></li>
                <li><a href="#" className="footer-link">API Access</a></li>
              </ul>
            </div>
            
            <div className="link-group">
              <h4 className="link-title">Support</h4>
              <ul className="links">
                <li><a href="#" className="footer-link">Documentation</a></li>
                <li><a href="#" className="footer-link">Help Center</a></li>
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
                <li><a href="#" className="footer-link">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            © 2025 NeoGuardian. All rights reserved. | Protecting Earth through space technology.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;