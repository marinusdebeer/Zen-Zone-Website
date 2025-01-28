// tracking.js

const Tracking = (() => {
  // Configuration Constants
  const GOOGLE_SCRIPT_ID = "AKfycbz62i7imbATSejzb0W_p7HH-8sjkIGlF2Q1hr8YZC6R7xclQDSUC-qXQ5nbgoihOyIJ";
  const DEBOUNCE_DELAY = 300; // Delay in milliseconds

  /**
   * Debounce function to limit the rate at which a function can fire.
   * @param {Function} func - The function to debounce.
   * @param {number} delay - The delay in milliseconds.
   * @returns {Function} - A debounced version of the input function.
   */
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

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
        "Content-Type": "text/plain;charset=utf-8" // Do not change this line to json
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

  // Create a debounced version of sendTrackingData
  const sendTrackingDataDebounced = debounce(sendTrackingData, DEBOUNCE_DELAY);

  return { sendTrackingData, sendTrackingDataDebounced };
})();
