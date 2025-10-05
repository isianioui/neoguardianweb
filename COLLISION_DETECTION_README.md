# Collision Detection System for NEO-Orrery

This document provides comprehensive instructions for implementing and using the ML-based collision detection system in your NEO-Orrery project.

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the frontend directory
cd frontend

# Install new dependencies
npm install

# Copy environment configuration
cp src/config/collisionConfig.js.example .env.local
```

### 2. Environment Setup

Create a `.env.local` file in the frontend directory:

```env
# NASA API Configuration
REACT_APP_NASA_API_KEY=your_nasa_api_key_here

# Backend Service Configuration
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_KEY=demo_key

# Collision Detection Configuration
REACT_APP_COLLISION_UPDATE_INTERVAL=60000
REACT_APP_ML_MODEL_VERSION=1.0.0
REACT_APP_RISK_THRESHOLD=0.01

# Development Configuration
REACT_APP_DEBUG_MODE=false
REACT_APP_MOCK_DATA=true
```

### 3. Get NASA API Key

1. Visit [NASA API Portal](https://api.nasa.gov/)
2. Sign up for a free account
3. Generate an API key
4. Add the key to your `.env.local` file

## 📁 File Structure

The collision detection system adds the following files to your project:

```
frontend/src/
├── components/
│   └── CollisionDetection/
│       ├── CollisionRiskPanel.jsx          # Risk assessment dashboard
│       ├── CollisionRiskPanel.css
│       ├── AlertSystem.jsx                 # Real-time alerts
│       ├── AlertSystem.css
│       ├── PredictionOverlay.jsx           # 3D trajectory predictions
│       ├── PredictionOverlay.css
│       ├── RiskHeatmap.jsx                 # Risk density visualization
│       ├── RiskHeatmap.css
│       ├── CollisionDetectionProvider.jsx  # Context provider
│       └── index.js                        # Export file
├── services/
│   ├── CollisionDetectionService.js        # Main orchestrator
│   ├── DataService.js                      # Data fetching
│   ├── MLPredictionService.js              # ML predictions
│   └── BackendService.js                   # Backend communication
├── models/
│   └── CollisionModels.js                  # Data models
├── config/
│   └── collisionConfig.js                  # Configuration
└── components/Orrery/
    ├── EnhancedOrrery.jsx                  # Enhanced orrery with collision detection
    └── EnhancedOrrery.css
```

## 🔧 Integration with Existing Project

### Option 1: Replace Existing Orrery Component

Replace your existing Orrery component with the enhanced version:

```jsx
// In your OrreryPage.jsx
import EnhancedOrrery from '../../components/Orrery/EnhancedOrrery';

const OrreryPage = () => {
    return (
        <div className="orrery-page">
            <Navigation />
            <div className="page-header">
                <h1>Solar System Orrery with Collision Detection</h1>
                <p>Interactive 3D visualization with ML-based collision prediction</p>
            </div>
            <EnhancedOrrery />
        </div>
    );
};
```

### Option 2: Add Collision Detection to Existing Component

Wrap your existing orrery with the collision detection provider:

```jsx
import { CollisionDetectionProvider } from '../CollisionDetection';
import CollisionRiskPanel from '../CollisionDetection/CollisionRiskPanel';
import AlertSystem from '../CollisionDetection/AlertSystem';

const OrreryPage = () => {
    return (
        <CollisionDetectionProvider>
            <div className="orrery-page">
                <Navigation />
                <div className="page-header">
                    <h1>Solar System Orrery</h1>
                    <p>Interactive 3D visualization with collision detection</p>
                </div>
                <YourExistingOrreryComponent />
                
                {/* Add collision detection components */}
                <CollisionRiskPanel />
                <AlertSystem />
            </div>
        </CollisionDetectionProvider>
    );
};
```

## 🎯 Features

### 1. Real-Time Risk Assessment
- **ML-Powered Predictions**: Uses ensemble of LSTM, Random Forest, and SVM models
- **Risk Categorization**: Low, Medium, High, and Critical risk levels
- **Confidence Scoring**: Each prediction includes confidence metrics
- **Real-Time Updates**: Continuous monitoring and risk assessment

### 2. Interactive Visualizations
- **3D Risk Indicators**: Visual risk markers in the 3D scene
- **Trajectory Predictions**: Future path visualization with uncertainty bounds
- **Risk Heatmap**: 2D risk density visualization
- **Collision Cones**: 3D collision probability visualization

### 3. Alert System
- **Real-Time Notifications**: Instant alerts for high-risk events
- **Mobile-Friendly**: Responsive design for mobile devices
- **Priority Levels**: Critical, High, Medium, and Low priority alerts
- **Alert History**: Track and manage alert history

### 4. Data Integration
- **NASA API Integration**: Real-time NEO data from NASA
- **Satellite Tracking**: Integration with satellite databases
- **Historical Data**: Collision event history and analysis
- **Offline Mode**: Mock data for development and testing

## 🛠️ Usage

### Basic Usage

```jsx
import { useCollisionDetection } from '../CollisionDetection';

const MyComponent = () => {
    const { 
        collisionService, 
        isInitialized, 
        isLoading, 
        error 
    } = useCollisionDetection();

    if (isLoading) return <div>Loading collision detection...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!isInitialized) return <div>Collision detection not available</div>;

    return (
        <div>
            <CollisionRiskPanel collisionService={collisionService} />
            <AlertSystem collisionService={collisionService} />
        </div>
    );
};
```

### Advanced Usage

```jsx
import { CollisionDetectionService } from '../CollisionDetection';

const MyAdvancedComponent = () => {
    const [collisionService, setCollisionService] = useState(null);

    useEffect(() => {
        const initService = async () => {
            const service = new CollisionDetectionService();
            await service.initialize();
            service.startRealTimeDetection();
            setCollisionService(service);
        };
        initService();
    }, []);

    const handleRiskAssessment = async () => {
        if (collisionService) {
            const assessment = await collisionService.performRiskAssessment();
            console.log('Risk Assessment:', assessment);
        }
    };

    return (
        <div>
            <button onClick={handleRiskAssessment}>
                Perform Risk Assessment
            </button>
        </div>
    );
};
```

## 🔧 Configuration

### Risk Thresholds

```javascript
// In collisionConfig.js
export const COLLISION_CONFIG = {
    RISK_THRESHOLD: 0.01,        // General risk threshold
    HIGH_RISK_THRESHOLD: 0.1,    // High risk threshold
    MEDIUM_RISK_THRESHOLD: 0.01, // Medium risk threshold
    LOW_RISK_THRESHOLD: 0.001,   // Low risk threshold
};
```

### Update Intervals

```javascript
export const COLLISION_CONFIG = {
    DATA_UPDATE_INTERVAL: 60000,    // 1 minute
    ML_PREDICTION_INTERVAL: 300000, // 5 minutes
    CACHE_TTL: 300000,              // 5 minutes
};
```

### Visualization Settings

```javascript
export const COLLISION_CONFIG = {
    MAX_VISIBLE_NEOS: 999,
    NEO_RADIUS: 0.01,
    RISK_INDICATOR_SIZE: 0.02,
    HEATMAP_RESOLUTION: 32,
};
```

## 📱 Mobile Support

The collision detection system is fully responsive and mobile-friendly:

- **Touch Controls**: Optimized for touch interactions
- **Responsive Layout**: Adapts to different screen sizes
- **Mobile Alerts**: Push notification support
- **Gesture Navigation**: Touch gestures for 3D navigation

## 🧪 Testing

### Mock Data Mode

Enable mock data for testing without real API calls:

```env
REACT_APP_MOCK_DATA=true
REACT_APP_DEBUG_MODE=true
```

### Unit Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Set the following environment variables in your production environment:

```env
REACT_APP_NASA_API_KEY=your_production_nasa_key
REACT_APP_BACKEND_URL=https://your-backend-url.com
REACT_APP_API_KEY=your_production_api_key
REACT_APP_MOCK_DATA=false
REACT_APP_DEBUG_MODE=false
```

## 🔍 Troubleshooting

### Common Issues

1. **NASA API Key Issues**
   - Ensure your API key is valid and has sufficient quota
   - Check the console for API error messages

2. **ML Models Not Loading**
   - Check browser console for model loading errors
   - Ensure you have a stable internet connection

3. **Performance Issues**
   - Reduce `MAX_VISIBLE_NEOS` in configuration
   - Increase `DATA_UPDATE_INTERVAL` for less frequent updates
   - Enable `MOCK_DATA` mode for testing

4. **Visualization Issues**
   - Check that Three.js is properly loaded
   - Ensure WebGL is supported in your browser

### Debug Mode

Enable debug mode for detailed logging:

```env
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
```

## 📊 Performance Optimization

### Recommended Settings

```javascript
// For high-performance systems
export const COLLISION_CONFIG = {
    MAX_VISIBLE_NEOS: 500,
    DATA_UPDATE_INTERVAL: 30000,
    HEATMAP_RESOLUTION: 64,
};

// For low-performance systems
export const COLLISION_CONFIG = {
    MAX_VISIBLE_NEOS: 100,
    DATA_UPDATE_INTERVAL: 120000,
    HEATMAP_RESOLUTION: 16,
};
```

## 🤝 Contributing

### Adding New Features

1. Create new components in `src/components/CollisionDetection/`
2. Add corresponding CSS files
3. Update the export file `src/components/CollisionDetection/index.js`
4. Add tests for new functionality

### Extending ML Models

1. Modify `src/services/MLPredictionService.js`
2. Add new model types in the `initializeModels()` method
3. Update prediction logic in `runEnsemblePrediction()`

## 📚 API Reference

### CollisionDetectionService

```javascript
// Initialize service
const service = new CollisionDetectionService();
await service.initialize();

// Start real-time detection
service.startRealTimeDetection();

// Get risk assessment
const assessment = await service.performRiskAssessment();

// Get collision risk between two objects
const risk = await service.getCollisionRisk(object1Id, object2Id);

// Get trajectory prediction
const trajectory = await service.getTrajectoryPrediction(objectId);
```

### Data Models

```javascript
import { NEO, Satellite, CollisionPrediction } from '../models/CollisionModels';

// Create NEO object
const neo = new NEO({
    id: 'neo_001',
    name: 'Asteroid 2023 VD3',
    diameter: 14.0,
    isHazardous: true,
    orbitalData: { /* orbital parameters */ }
});

// Create collision prediction
const prediction = new CollisionPrediction({
    object1: 'neo_001',
    object2: 'sat_001',
    collisionProbability: 0.01,
    riskCategory: 'Medium',
    confidence: 0.85
});
```

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all dependencies are properly installed
4. Verify environment variables are set correctly

## 📄 License

This collision detection system is part of the NEO-Orrery project and follows the same license terms.

