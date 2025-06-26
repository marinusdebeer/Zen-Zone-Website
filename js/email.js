// Email.js
const Email = (() => {
  // ─── Configuration Constants ───────────────────────────────────────────────
  const SERVICE_ID               = "service_156d2p8";     // Your EmailJS service ID
  const FORM_TEMPLATE_ID         = "template_i7i7zz7";   // Admin template
  const CONFIRMATION_TEMPLATE_ID = "template_nrcx4ff";   // User template
  const USER_ID                  = "9CwBWUPI_pCtZXPr0";   // Your EmailJS user ID
  const SCRIPT_ID                = "AKfycbyn3NfpohU44cSGMC6R9Dp4UyidZ5FbqXMy2Ift1CWbxWx6m951QhiyabOiuo34S3XhsA";

  // Initialize EmailJS
  emailjs.init(USER_ID);

  // ─── Helpers ────────────────────────────────────────────────────────────

  /**
   * Uploads all chosen files to your FastAPI / S3 endpoint and returns
   * { success, urls: string[], folder: string }
   */
  async function uploadAllImages(files, data) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("images", file);
      formData.append('first_name', data.firstName);
      formData.append('last_name',  data.lastName);
      formData.append('phone',      data.phone);
    }

    const resp = await fetch("https://prod.zenzonecleaning.ca/upload-images", {
      method: "POST",
      body: formData,
    });
    const result = await resp.json();
    if (!result.success) {
      throw new Error("Image upload failed");
    }
    return result; // { urls: [...], folder: "uploads/booking-..." }
  }

  /**
   * Formats the booking data into a plain-text block.
   * Used for the customer confirmation email.
   */
  function formatPlainText(data) {
    return [
      "===== Contact Information =====",
      `First Name: ${data.firstName || ""}`,
      `Last Name:  ${data.lastName || ""}`,
      `Company:    ${data.company || ""}`,
      `Email:      ${data.email || ""}`,
      `Phone:      ${data.phone || ""}`,
      "",
      "===== Address =====",
      `Street:     ${data.address || ""}`,
      `City:       ${data.city || ""}`,
      `Province:   ${data.province || ""}`,
      `Postal:     ${data.postal || ""}`,
      "",
      "===== Property Details =====",
      `Property Type: ${data.propertyType || "N/A"}`,
      `Industry Type: ${data.industry    || "N/A"}`,
      `Square Footage: ${data.squareFootage || "N/A"}`,
      "",
      "===== Service Information =====",
      `Service Type: ${data.serviceType  || "N/A"}`,
      `Booking Type: ${data.bookingType  || "N/A"}`,
      `Frequency:    ${data.frequency    || "N/A"}`,
      `Package (hrs):${data.package      || "N/A"}`,
      `Extras:       ${Array.isArray(data.extras) ? data.extras.join(", ") : (data.extras||"N/A")}`,
      "",
      "===== Dates =====",
      `Preferred Date: ${data.date || ""}`,
      "",
      "===== Notes & Access =====",
      `Access: ${data.access || ""}`,
      `Notes:  ${data.details || ""}`,
      "",
      `Heard About Us: ${data.hearAbout || ""}`
    ].join("\n");
  }

  // ─── Main function ───────────────────────────────────────────────────────

  async function sendBookingRequest(data) {
    // 1) Upload images (if any) to S3 via your FastAPI endpoint
    const imageInput = document.getElementById("booking-images");
    let imageUrls = [];
    let folder     = "";
    if (imageInput?.files?.length) {
      const result   = await uploadAllImages(imageInput.files, data);
      imageUrls      = result.urls;
      folder         = result.folder;
    }
    const archiveLink = `https://prod.zenzonecleaning.ca/images/archive/${folder}`;

    // 2) Build HTML table of all fields for admin email
    const fields = [
      ["First Name", data.firstName],
      ["Last Name",  data.lastName],
      ["Company",    data.company],
      ["Email",      data.email],
      ["Phone",      data.phone],
      ["Street",     data.address],
      ["City",       data.city],
      ["Province",   data.province],
      ["Postal",     data.postal],
      ["Property Type", data.propertyType],
      ["Industry Type", data.industry],
      ["Square Footage", data.squareFootage],
      ["Bedrooms",       data.bedrooms],
      ["Bathrooms",      data.bathrooms],
      ["Service Type",   data.serviceType],
      ["Booking Type",   data.bookingType],
      ["Frequency",      data.frequency],
      ["Package (hrs)",  data.package],
      ["Extras",         Array.isArray(data.extras) ? data.extras.join(", ") : data.extras],
      ["Preferred Date", data.date],
      ["Access",         data.access],
      ["Notes",          data.details],
      ["Heard About",    data.hearAbout]
    ];
    const rowsHtml = fields.map(
      ([label, val]) => `
      <tr>
        <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #eee;">${label}</th>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;">${val||"—"}</td>
      </tr>`
    ).join("");

    // 3) Inline thumbnails for admin
    const thumbsHtml = imageUrls.length
      ? `<p style="font-family:sans-serif;">
           <a href="${archiveLink}">Download all images as ZIP</a>
         </p>`
      : "";

    // 4) UTM/GCLID block
    const utmHtml = `
      <h3 style="font-family:sans-serif;">Marketing Tracking</h3>
      <ul style="font-family:sans-serif;line-height:1.4;">
        <li><strong>UTM Campaign:</strong> ${localStorage.getItem("utm_campaign")||"—"}</li>
        <li><strong>UTM Source:</strong>   ${localStorage.getItem("utm_source")||"—"}</li>
        <li><strong>UTM Medium:</strong>   ${localStorage.getItem("utm_medium")||"—"}</li>
        <li><strong>UTM Content:</strong>  ${localStorage.getItem("utm_content")||"—"}</li>
        <li><strong>UTM Term:</strong>     ${localStorage.getItem("utm_term")||"—"}</li>
        <li><strong>GCLID:</strong>        ${localStorage.getItem("gclid")||"—"}</li>
      </ul>`;

    // 5) Compose full admin HTML
    const adminHtml = `
      <h2 style="font-family:sans-serif;color:#333;">New Booking Request</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;color:#333;margin-bottom:16px;">
        ${rowsHtml}
      </table>
      ${thumbsHtml}
      ${utmHtml}
    `;

    // 6) Send Admin email (use {{{message}}} in your EmailJS template!)
    await emailjs.send(SERVICE_ID, FORM_TEMPLATE_ID, {
      lead_name: `${data.firstName||""} ${data.lastName||""}`.trim(),
      message:   adminHtml
    });

    // 7) Send Confirmation to User (simple HTML summary)
    const userHtml = formatPlainText(data).replace(/\n/g, "<br>");
    return emailjs.send(SERVICE_ID, CONFIRMATION_TEMPLATE_ID, {
      to_email:  data.email,
      from_name: "Zen Zone Cleaning Services",
      to_name:   data.firstName,
      message:   userHtml
    });
  }

  return { sendBookingRequest };
})();
