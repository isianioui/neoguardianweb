// Notification Service for NEO-Orrery
// Handles real-time synchronization of collision notifications between web and mobile apps

import { database } from './firebaseConfig';
import { ref, set, onValue, push, remove, update } from 'firebase/database';

// Reference to the notifications collection in Firebase
const notificationsRef = ref(database, 'notifications');

// Firebase Cloud Messaging server key
// To get your Server Key:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project "neoguardian-dee0c"
// 3. Click on Project Settings (gear icon)
// 4. Go to the "Cloud Messaging" tab
// 5. Copy the Server key from "Project credentials" section
const FCM_SERVER_KEY = ''; // Paste your Server Key here

// Export notificationsRef so it can be used in other components
export { notificationsRef };

/**
 * Add a new notification to Firebase
 * @param {Object} notification - The notification object to add
 * @returns {Promise} - Promise that resolves with the notification ID
 */
export const addNotification = async (notification) => {
  try {
    // Generate a unique ID for the notification
    const newNotificationRef = push(notificationsRef);
    const notificationWithId = {
      ...notification,
      id: newNotificationRef.key,
      timestamp: Date.now(),
      read: false
    };
    
    // Save to Firebase
    await set(newNotificationRef, notificationWithId);
    return newNotificationRef.key;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
};

/**
 * Get all notifications with real-time updates
 * @param {Function} callback - Function to call when notifications change
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNotifications = (callback) => {
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    const notificationsList = data ? Object.values(data) : [];
    callback(notificationsList);
  });
  
  // Return unsubscribe function
  return () => {
    // Unsubscribe logic if needed
  };
};

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification to mark as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await update(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await remove(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    await set(notificationsRef, null);
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
};

/**
 * Create a collision notification (database-driven approach)
 * @param {Object} collisionData - Data about the collision
 * @returns {Promise} - Promise that resolves with the notification ID
 */
export const createCollisionWithNotification = async (collisionData) => {
  try {
    // Add to database with special flag for mobile notification
    const newRef = push(notificationsRef);
    const notificationWithId = {
      ...collisionData,
      id: newRef.key,
      timestamp: Date.now(),
      read: false,
      // Add special flags for mobile app to detect new notifications
      notifyMobile: true,
      notificationInfo: {
        title: `${collisionData.risk.prediction.riskCategory} Risk Alert`,
        body: `${collisionData.risk.object1} approaching ${collisionData.risk.object2}`,
        severity: collisionData.risk.prediction.riskCategory.toLowerCase(),
        createdAt: Date.now()
      }
    };
    
    // Save to Firebase - mobile app will listen for changes with notifyMobile=true
    await set(newRef, notificationWithId);
    console.log('Notification created with mobile alert flag:', newRef.key);
    
    return newRef.key;
  } catch (error) {
    console.error('Error creating collision with notification:', error);
    throw error;
  }
};