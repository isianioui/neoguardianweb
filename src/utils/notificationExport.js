/**
 * Utility functions for exporting collision notifications in a format suitable for mobile apps
 */

/**
 * Formats a notification for export to mobile apps
 * @param {Object} notification - The notification object to format
 * @returns {Object} - Formatted notification data for mobile
 */
export const formatNotificationForMobile = (notification) => {
  return {
    id: notification.id,
    timestamp: notification.timestamp,
    title: "High Risk Collision Detected",
    description: `${notification.risk.object1} and ${notification.risk.object2} have a high collision risk.`,
    details: {
      object1: notification.risk.object1,
      object2: notification.risk.object2,
      probability: notification.risk.prediction.collisionProbability,
      nearestPlanet: notification.nearestPlanet,
      distanceFromEarth: notification.distanceFromEarth,
      minimumDistance: notification.risk.prediction.minimumDistance,
      timeToClosestApproach: notification.risk.prediction.timeToClosestApproach || 0
    },
    read: notification.read,
    severity: "high"
  };
};

/**
 * Exports a single notification as JSON for mobile app consumption
 * @param {Object} notification - The notification to export
 * @returns {string} - JSON string of the notification data
 */
export const exportSingleNotification = (notification) => {
  const formattedData = formatNotificationForMobile(notification);
  return JSON.stringify(formattedData, null, 2);
};

/**
 * Exports all notifications as JSON for mobile app consumption
 * @param {Array} notifications - Array of notifications to export
 * @returns {string} - JSON string of all notification data
 */
export const exportAllNotifications = (notifications) => {
  const formattedData = notifications.map(formatNotificationForMobile);
  return JSON.stringify(formattedData, null, 2);
};

/**
 * Downloads notification data as a JSON file
 * @param {string} jsonData - JSON string to download
 * @param {string} filename - Name of the file to download
 */
export const downloadNotificationData = (jsonData, filename) => {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};