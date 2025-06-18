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
      First Name: ${data.firstName || ""}
      Last Name: ${data.lastName || ""}
      Company: ${data.company || ""}
      Email: ${data.email}
      Phone: ${data.phone}
      Industry Type: ${data.industryType || "N/A"}
      Property Type: ${data.propertyType || "N/A"}
      Reason: ${data.reason || ""}
      Frequency: ${data.cleanFrequency || data.frequency || "N/A"}
      Booking Type: ${data.bookingType || "N/A"}
      Service Type: ${data.serviceType || "N/A"}
      Square Footage: ${data.squareFootage || "N/A"}
      Kitchens: ${data.kitchens || "N/A"}
      Bedrooms: ${data.bedrooms || "N/A"}
      Bathrooms: ${data.bathrooms || "N/A"}
      Powder Rooms: ${data.powderRooms || "N/A"}
      Other Rooms: ${data.otherRooms || "N/A"}
      Airbnb Beds: ${data.airbnbBeds || "N/A"}
      Last Cleaned: ${data.lastCleaned || ""}
      Built/Renovated: ${data.builtYear || ""}
      Pets: ${data.pets || ""}
      Occupants: ${data.occupants || ""}
      Occupied: ${data.occupied || ""}
      Furnished: ${data.furnished || ""}
      Extras: ${data.extras || "N/A"}
      Package: ${data.package || "N/A"} Hours
      Price: ${data.price || "N/A"}
      Street1: ${data.street1 || ""}
      Street2: ${data.street2 || ""}
      City: ${data.city || ""}
      Province: ${data.province || ""}
      Postal: ${data.postal || ""}
      Interior Windows: ${data.interiorWindows || ""}
      Empty Cabinets: ${data.emptyCabinets || ""}
      Preferred Date: ${data.date || ""}
      Notes: ${data.details || ""}
      Hear About Us: ${data.hearAbout || ""}
    `.trim();
  };

  /**
   * Send booking request emails via EmailJS
   * @returns {Promise} - Returns a promise to enable `.then()` chaining
   */
  const sendBookingRequest = (data) => {
    // Prepare the Admin Email Parameters
    const adminParams = {
      lead_name: data.name,
      message: formatMessage(data),
      utm_campaign: localStorage.getItem('utm_campaign'),
      utm_source: localStorage.getItem('utm_source'),
      utm_medium: localStorage.getItem('utm_medium'),
      utm_content: localStorage.getItem('utm_content'),
      gclid: localStorage.getItem('gclid'),
    };
    // console.log("Admin email params:", adminParams, adminParams.message);

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
        // console.log("User email params:", userParams, userParams.message);

        // Return second email send promise
        return emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, userParams);
      });
  };

  return { sendBookingRequest };
})();