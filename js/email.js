// Email.js
const Email = (() => {
  // Configuration Constants
  const SERVICE_ID = "service_156d2p8"; // Replace with your actual EmailJS service ID
  const FORM_TEMPLATE_ID = "template_i7i7zz7";
  const CONFIRMATION_TEMPLATE_ID = "template_nrcx4ff";
  const USER_ID = "9CwBWUPI_pCtZXPr0"; // Replace with your actual EmailJS user ID
  const SCRIPT_ID = "AKfycbyn3NfpohU44cSGMC6R9Dp4UyidZ5FbqXMy2Ift1CWbxWx6m951QhiyabOiuo34S3XhsA"
  // Initialize EmailJS
  emailjs.init(USER_ID);

  async function uploadImageToAppsScript(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1]; // remove data URI prefix
          console.log("uploading image to apps script");
          const response = await fetch(`https://script.google.com/macros/s/${SCRIPT_ID}/exec`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: new URLSearchParams({
              image: base64Data,
              contentType: file.type
            })
          });
          console.log("image uploaded to apps script");
          const result = await response.json();
          console.log("result", result);
          if (result.status === "success") {
            resolve(result.url); // ✅ return URL
          } else {
            reject(result.message || "Unknown error during upload.");
          }
        } catch (err) {
          reject(err.toString());
        }
      };
  
      reader.onerror = () => reject("File reading failed.");
      reader.readAsDataURL(file);
    });
  }
  
  
  
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
      Industry Type: ${data.industry || "N/A"}
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
      Built Year: ${data.builtYear || ""}
      Last Renovated: ${data.lastRenovated || ""}
      Pets: ${data.pets || ""}
      Occupants: ${data.people || ""}
      Furnished: ${data.furnished || ""}
      Extras: ${data.extras || "N/A"}
      Package: ${data.package || "N/A"} Hours
      Price: ${data.price || "N/A"}
      Address: ${data.address || ""}
      City: ${data.city || ""}
      Province: ${data.province || ""}
      Postal: ${data.postal || ""}
      Interior Windows: ${data.interiorWindows || ""}
      Inside Empty Kitchen Cabinets: ${data.insideEmptyKitchenCabinets || ""}
      Preferred Date: ${data.date || ""}
      Notes: ${data.details || ""}
      Hear About Us: ${data.hearAbout || ""}
    `.trim();
  };
  

  /**
   * Send booking request emails via EmailJS
   * @returns {Promise} - Returns a promise to enable `.then()` chaining
   */
  const sendBookingRequest = async (data) => {
    // const imageInput = document.getElementById('booking-images');
    // let imageLinks = [];

    // if (imageInput?.files?.length) {
    //   for (const file of imageInput.files) {
    //     const url = await uploadImageToAppsScript(file);
    //     imageLinks.push(url);
    //   }
    // }

    // const imageLinksHTML = imageLinks.length
    //   ? `<br><br><strong>Uploaded Images:</strong><br>` + imageLinks.map(url => `<a href="${url}" target="_blank">${url}</a>`).join('<br>')
    //   : '';

    // const messageBody = formatMessage(data).replace(/\n/g, '<br>') + imageLinksHTML;
    const messageBody = formatMessage(data)

  
    const adminParams = {
      lead_name: data.name,
      message: messageBody,
      utm_campaign: localStorage.getItem('utm_campaign'),
      utm_source: localStorage.getItem('utm_source'),
      utm_medium: localStorage.getItem('utm_medium'),
      utm_content: localStorage.getItem('utm_content'),
      utm_term: localStorage.getItem('utm_term'),
      gclid: localStorage.getItem('gclid'),
    };
  
    await emailjs.send(SERVICE_ID, FORM_TEMPLATE_ID, adminParams);
  
    const userParams = {
      to_email: data.email,
      from_name: "Zen Zone Cleaning Services",
      to_name: data.name,
      message: messageBody,
    };
  
    return emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, userParams);
  };
  

  return { sendBookingRequest };
})();