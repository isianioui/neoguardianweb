# Orrery Integration Documentation

## Overview
This document describes the integration of the HTML/CSS/JS orrery project into the Vite+React frontend application.

## Files Integrated

### Core Components
- **Orrery.jsx** - Main Three.js orrery component with full functionality
- **Orrery.css** - Styling for the orrery interface
- **TimeUtils.js** - Time conversion utilities (MJD, JD, datetime)
- **orbits.js** - Orbital mechanics calculations and Three.js orbit creation

### Pages
- **Explore.jsx** - Explore page that displays the orrery
- **OrreryPage.jsx** - Dedicated orrery page
- **Navigation.jsx** - Navigation component for page transitions

### Data Files
- **planet_data.json** - Planet orbital parameters and properties
- **risk_list_neo_data.json** - Near-Earth Object data
- **stream_dataIAU2022.json** - Meteor shower stream data
- **stream_parentbody.json** - Parent body data for meteor showers

### Assets
- **body_textures/** - Planet and celestial body textures
- **Skybox textures** - px.png, nx.png, py.png, ny.png, pz.png, nz.png
- **Time control icons** - icon-time-*.png files

## Features Implemented

### 3D Visualization
- Real-time solar system simulation
- Planet orbits with accurate orbital mechanics
- Near-Earth Object (NEO) tracking
- Meteor shower visualization
- Interactive camera controls (orbit, zoom, pan)

### Time Controls
- Time speed adjustment (real-time to 365 days/second)
- Fast forward/backward controls
- "Now" button to return to current time
- Real-time date/time display

### Filtering System
- Toggle visibility of planets, dwarf planets, NEOs, meteor showers
- Filter by risk level, size, orbital parameters
- Real-time filter updates

### Interactive Features
- Click on orbits to select objects
- Information panel with object details
- Object tracking and highlighting
- Responsive design for mobile devices

## Navigation

### Routes
- `/` - Home page with landing content
- `/explore` - Interactive orrery (main entry point)
- `/orrery` - Alternative orrery page

### Navigation Elements
- Header "Explore" button navigates to `/explore`
- Hero section "Explore Space" button navigates to `/explore`
- Navigation component provides back/home buttons on orrery pages

## Technical Implementation

### Dependencies Added
- `three` - Three.js for 3D graphics
- `react-router-dom` - Client-side routing
- `nouislider` - Range sliders for filters

### Key Classes
- **Body** - Represents celestial bodies (planets, NEOs)
- **Shower** - Represents meteor showers and parent bodies
- **FilterConditions** - Manages visibility filters

### Performance Optimizations
- FPS-controlled animation loop (60 FPS target)
- Efficient object culling and filtering
- Optimized Three.js geometry and materials

## Usage

1. Start the development server: `npm run dev`
2. Navigate to the home page
3. Click "Explore" in the header or "Explore Space" in the hero section
4. Use mouse controls to navigate the 3D scene:
   - Left click + drag: Rotate view
   - Right click + drag: Pan view
   - Scroll: Zoom in/out
5. Use time controls to adjust simulation speed
6. Use filter panel to show/hide different object types
7. Click on orbits to view object information

## Browser Compatibility
- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with WebGL support

## Performance Notes
- Large datasets (NEOs, meteor showers) are limited for performance
- Texture loading is optimized for web delivery
- Animation loop includes frame rate limiting
