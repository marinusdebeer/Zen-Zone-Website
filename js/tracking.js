// tracking.js

const Tracking = (() => {
  // Configuration Constants
  const GOOGLE_SCRIPT_ID = "AKfycbx5RXzUMFjXjxANpN1oOAj3H6YBjV6XzReF8SLCCVJqK54szwLS0JxHi-SyJE6zQqA0"; // Replace with your actual Google Apps Script ID

  /**
   * Send tracking data to Google Apps Script
   * @param {string} fieldId - The ID of the field (without "booking-" prefix)
   * @param {string} value - The value of the field
   */
  const sendTrackingData = (fieldId, value) => {
    // Get the unique user ID from localStorage
    const userId = localStorage.getItem("uniqueId") || `user-${Date.now()}`;
    localStorage.setItem("uniqueId", userId); // Ensure it's stored for future reference

    const data = { userId, fieldId, value };

    fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`Failed to send data for ${fieldId}:`, response.status);
        }
      })
      .catch((error) => {
        console.error(`Error sending data for ${fieldId}:`, error);
      });
  };

  return { sendTrackingData };
})();
