const Email = (() => {
  // Configuration Constants
  const SERVICE_ID = "service_156d2p8"; // Replace with your actual EmailJS service ID
  const FORM_TEMPLATE_ID = "template_i7i7zz7";
  const CONFIRMATION_TEMPLATE_ID = "template_nrcx4ff";
  const USER_ID = "9CwBWUPI_pCtZXPr0"; // Replace with your actual EmailJS user ID

  // Initialize EmailJS
  emailjs.init(USER_ID);

  /**
   * Formats the booking request details into a structured message
   */
  const formatMessage = (data) => {
    return `
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone}
      Service: ${data.service || "N/A"}
      Cleaning Type: ${data.industry || "N/A"}
      Booking Type: ${data.bookingType || "N/A"}
      Frequency: ${data.frequency || "N/A"}
      Service Type: ${data.serviceType || "N/A"}
      Square Footage: ${data.squareFootage || "N/A"}
      Bedrooms: ${data.bedrooms || "N/A"}
      Bathrooms: ${data.bathrooms || "N/A"}
      Powder Rooms: ${data.powderRooms || "N/A"}
      Extras: ${data.extras || "N/A"}
      Package: ${data.package || "N/A"}
      Address: ${data.address || "N/A"}
      Preferred Date: ${data.date || "N/A"}
      Additional Details: ${data.details || "N/A"}
    `.trim();
  };

  /**
   * Send booking request emails via EmailJS
   * @returns {Promise} - Returns a promise to enable `.then()` chaining
   */
  const sendBookingRequest = (data) => {
    console.log("Sending booking request:", data);
    console.log(formatMessage(data));
    // Prepare the Admin Email Parameters
    const adminParams = {
      to_email: "admin@zenzonecleaning.com",
      from_name: data.name,
      message: formatMessage(data),
    };

    console.log("Admin email params:", adminParams);

    // Return the promise chain
    return emailjs.send(SERVICE_ID, FORM_TEMPLATE_ID, adminParams)
      .then(() => {
        // Prepare the User Confirmation Email Parameters
        const userParams = {
          to_email: data.email,
          from_name: "Zen Zone Cleaning Services",
          to_name: data.name,
          message: formatMessage(data),
        };

        console.log("User email params:", userParams);

        // Return second email send promise
        return emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, userParams);
      });
  };

  return { sendBookingRequest };
})();