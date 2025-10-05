// Test utilities for Firebase notifications
import { addNotification } from './notificationService';

/**
 * Add a test notification to the Firebase database
 * @returns {Promise} - Promise that resolves when the notification is added
 */
export const addTestNotification = async () => {
  const testNotification = {
    timestamp: new Date().toISOString(),
    risk: {
      object1: '2020 AV2',
      object2: 'International Space Station',
      prediction: {
        collisionProbability: 0.15,
        riskCategory: 'High',
        confidence: 0.85,
        minimumDistance: 5280,
        timeToClosestApproach: 14.5
      }
    },
    read: false,
    nearestPlanet: 'Earth',
    distanceFromEarth: 384400, // Distance to the Moon in km
  };
  
  return addNotification(testNotification);
};