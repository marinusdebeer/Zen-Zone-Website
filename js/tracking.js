// tracking.js

const Tracking = (() => {
  // Configuration Constants
  const GOOGLE_SCRIPT_ID = "AKfycbz62i7imbATSejzb0W_p7HH-8sjkIGlF2Q1hr8YZC6R7xclQDSUC-qXQ5nbgoihOyIJ";
  const DEBOUNCE_DELAY = 300; // Delay in milliseconds
  const MAX_RETRIES = 3; // Maximum number of retry attempts

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
        func(...args);
      }, delay);
    };
  };

  /**
   * Send tracking data to Google Apps Script with retry mechanism
   * @param {string} fieldId - The ID of the field (without "booking-" prefix)
   * @param {string} value - The value of the field
   * @param {number} [attempt=1] - Current attempt number
   */
  const sendTrackingData = (fieldId, value, attempt = 1) => {
    console.log(fieldId);
    if (fieldId.startsWith("booking-")) {
      fieldId = fieldId.replace("booking-", "");
    }
    console.log(`Sending tracking data for ${fieldId}: ${value}`);
    // Get the unique user ID from localStorage
    const userId = localStorage.getItem("uniqueId") || `user-${Date.now()}`;
    localStorage.setItem("uniqueId", userId); // Ensure it's stored for future reference

    const data = { userId, fieldId, value };
    fetch(`https://script.google.com/macros/s/${GOOGLE_SCRIPT_ID}/exec`, {
      method: "POST",
      headers: {
         "Content-Type": "text/plain;charset=utf-8" // do not change this line ever!!!
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to send data for ${fieldId}: ${response.status}`);
        }
      })
      .catch((error) => {
        console.error(`Error sending data for ${fieldId}:`, error);
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying (${attempt + 1}/${MAX_RETRIES})...`);
          sendTrackingData(fieldId, value, attempt + 1);
        } else {
          console.error(`Failed to send data for ${fieldId} after ${MAX_RETRIES} attempts.`);
        }
      });
  };

  // Create a debounced version of sendTrackingData
  const sendTrackingDataDebounced = debounce(sendTrackingData, DEBOUNCE_DELAY);

  return { sendTrackingData, sendTrackingDataDebounced };
})();
