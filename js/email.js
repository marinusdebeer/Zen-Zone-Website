// Email.js
const Email = (() => {
  const Tracking = window.Tracking;
  // ─── Configuration ────────────────────────────────────────────────
  const SERVICE_ID         = "service_156d2p8";     // Your EmailJS service ID
  const ADMIN_TEMPLATE_ID  = "template_i7i7zz7";   // Admin notification template
  const CLIENT_TEMPLATE_ID = "template_nrcx4ff";   // Client confirmation template
  const USER_ID            = "9CwBWUPI_pCtZXPr0";   // Your EmailJS user ID

  // Initialize EmailJS
  emailjs.init(USER_ID);

  // ─── Helpers ─────────────────────────────────────────────────────

  /** Generic EmailJS send wrapper */
  const sendEmail = (templateId, payload) =>
    emailjs.send(SERVICE_ID, templateId, payload);

  /**
   * Uploads all image files to your FastAPI/S3 endpoint.
   * Returns { urls: string[], folder: string }.
   */
  async function uploadAllImages(files, data) {
    const formData = new FormData();
    const time = new Date().getTime();
    for (const file of files) {
      formData.append("images", file);
      formData.append("first_name", data.firstName || "Client");
      formData.append("last_name",  data.lastName || "Client");
      formData.append("phone",      data.phone || time.toString());
    }
    const resp = await fetch("https://prod.zenzonecleaning.ca/upload-images", {
      method: "POST",
      body: formData,
    });
    const result = await resp.json();
    if (!result.success) throw new Error("Image upload failed");
    return result; // { urls, folder }
  }

  /** Flattens your booking data into [label, value] pairs */
  const fieldRows = data => [
    ["First Name",               data.firstName],
    ["Last Name",                data.lastName],
    ["Company",                  data.company],
    ["Email",                    data.email],
    ["Phone",                    data.phone],
    ["Industry",                 data.industry],
    ["Property Type",            data.propertyType],
    ["Reason for Cleaning",      data.reason],
    ["Service Type",             data.serviceType],
    ["Booking Type",             data.bookingType],
    ["Frequency",                data.frequency],
    ["First Time Deep Cleaning", data.firstTimeDeepCleaning],
    ["Package (hrs)",            data.package],
    ["Extras",                   Array.isArray(data.extras) ? data.extras.join(", ") : data.extras],
    ["Interior Windows",         data.interiorWindows],
    ["Kitchen Cabinets",         data.insideEmptyKitchenCabinets],
    ["Square Footage",           data.squareFootage],
    ["Levels",                   data.levels],
    ["Bedrooms",                 data.bedrooms],
    ["Bathrooms",                data.bathrooms],
    ["Powder Rooms",             data.powderRooms],
    ["Kitchens",                 data.kitchens],
    ["People in Household",      data.people],
    ["Pets",                     data.pets],
    ["Furnished",                data.furnished],
    ["Street",                   data.address],
    ["City",                     data.city],
    ["Province",                 data.province],
    ["Postal",                   data.postal],
    ["Preferred Date",           data.date],
    ["Access Method",            data.accessMethod],
    ["Access Details",           data.accessDetails],
    ["Notes",                    data.details],
    ["Heard About",              data.hearAbout]
  ];

  /**
   * Builds the shared <h2> + <table> HTML block.
   * @param {string} title — heading text
   * @param {[string,string][]} rows — output of fieldRows(data)
   */
  const buildBaseHtml = (title, rows) => `
    <h2 style="font-family:sans-serif;color:#333;margin-bottom:8px;">
      ${title}
    </h2>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;color:#333;margin-bottom:16px;">
      ${rows.map(
        ([label, val]) => `
        <tr>
          <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #eee;">
            ${label}
          </th>
          <td style="padding:4px 8px;border-bottom:1px solid #eee;">
            ${val || "—"}
          </td>
        </tr>`
      ).join("")}
    </table>`;

  /** Builds the UTM/GCLID tracking block for admin */
  const buildTrackingBlock = () => `
    <h3 style="font-family:sans-serif;margin-top:0;">Marketing Tracking</h3>
    <ul style="font-family:sans-serif;line-height:1.4;margin-top:4px;">
      ${["utm_campaign","utm_source","utm_medium","utm_content","utm_term","gclid"]
        .map(key => `
          <li>
            <strong>${key.replace(/_/g,' ').toUpperCase()}:</strong>
            ${localStorage.getItem(key) || "—"}
          </li>`).join("")}
    </ul>`;

  /**
   * Builds the admin-only image download link block.
   * @param {string[]} urls
   * @param {string} folder
   */
  const buildImageSection = (urls, folder) =>
    urls.length
      ? `<p style="font-family:sans-serif;margin-top:0;">
           <a href="https://prod.zenzonecleaning.ca/images/archive/${folder}">
             📦 Download all images as ZIP
           </a>
         </p>`
      : "";


  // ─── Main Function ─────────────────────────────────────────────────

  /**
   * Sends both the admin notification and the client confirmation emails.
   * @param {object} data — your collected booking data
   */
  async function sendBookingRequest(data) {
    // 1) Handle image upload (if any)
    const imageInput = document.getElementById("booking-images");
    let imageUrls = [], folder = "";
    if (imageInput?.files?.length) {
      const result = await uploadAllImages(imageInput.files, data);
      imageUrls = result.urls;
      folder    = result.folder;
    }

    // 2) Track the archive link
    const archiveLink = `https://prod.zenzonecleaning.ca/images/archive/${folder}`;
    if (window.Tracking?.sendData) {
      console.log(archiveLink);
      console.log('Tracking available, sending data');
      window.Tracking.sendData('images', archiveLink);
    } else {
      console.warn('Tracking UNAVAILABLE, skipping sendData');
    }


    // 3) Prepare the shared table HTML
    const rows = fieldRows(data);

    // 4) Compose & send Admin email
    const adminHtml = `
      ${buildBaseHtml("New Booking Request", rows)}
      ${buildImageSection(imageUrls, folder)}
      ${buildTrackingBlock()}
    `;
    await sendEmail(ADMIN_TEMPLATE_ID, {
      lead_name: `${data.firstName} ${data.lastName}`.trim(),
      message:   adminHtml
    });

    // 5) Compose & send Client confirmation email
    const clientHtml = buildBaseHtml("", rows);
    return sendEmail(CLIENT_TEMPLATE_ID, {
      to_email:  data.email || "marinusdebeer@gmail.com",
      from_name: "Zen Zone Cleaning Services",
      to_name:   data.firstName || "Client",
      message:   clientHtml
    });
  }

  return { sendBookingRequest };
})();
