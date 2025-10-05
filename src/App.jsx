import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import HeroSection from './components/HeroSection/HeroSection';
import AboutSection from './components/AboutSection/AboutSection';
import TechnologySection from './components/TechnologySection/TechnologySection';
import ContactSection from './components/ContactSection/ContactSection';
import Footer from './components/Footer/Footer';
import Explore from './pages/Explore/Explore';
import OrreryPage from './pages/Orrery/OrreryPage';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <HeroSection />
              <AboutSection />
              <TechnologySection />
              <ContactSection />
              <Footer />
            </>
          } />
          <Route path="/explore" element={<Explore />} />
          <Route path="/orrery" element={<OrreryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;