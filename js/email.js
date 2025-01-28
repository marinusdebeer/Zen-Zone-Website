// email.js

const Email = (() => {
  // Configuration Constants
  const SERVICE_ID = "service_156d2p8"; // Replace with your actual EmailJS service ID
  const FORM_TEMPLATE_ID = "template_i7i7zz7";
  const CONFIRMATION_TEMPLATE_ID = "template_nrcx4ff";
  const USER_ID = "9CwBWUPI_pCtZXPr0"; // Replace with your actual EmailJS user ID

  // Initialize EmailJS
  emailjs.init(USER_ID);

  /**
   * Send booking request emails via EmailJS
   * @param {object} data - Form data collected from the booking form
   * @returns {Promise} - Returns a promise that resolves when both emails are sent
   */
  const sendBookingRequest = (data) => {
    // Prepare the Admin Email Parameters
    const adminParams = {
      to_email: "admin@zenzonecleaning.com", // Replace with your admin email
      from_name: data.name,
      from_email: data.email,
      phone: data.phone,
      service: data.service,
      square_footage: data.squareFootage,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      powder_rooms: data.powderRooms,
      address: data.address,
      preferred_date: data.date,
      additional_details: data.details || "N/A",
    };

    // Send Admin Email
    return emailjs
      .send(SERVICE_ID, FORM_TEMPLATE_ID, adminParams) // Send admin email
      .then(() => {
        // Prepare the User Confirmation Email Parameters
        const userParams = {
          to_email: data.email,
          from_name: "Zen Zone Cleaning Services",
          service: data.service,
          preferred_date: data.date,
          address: data.address,
          additional_details: data.details || "N/A",
        };

        // Send User Confirmation Email
        return emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, userParams);
      });
  };

  return { sendBookingRequest };
})();
