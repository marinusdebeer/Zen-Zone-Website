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

  /**
   * Builds the shared <h2> + <table> HTML block.
   * @param {string} title — heading text
   * @param {[string,string][]} rows — output of fieldRows(data)
   */
  const buildBaseHtml = (title, rows) => `
    <h2 style="font-family:sans-serif;color:#333;margin-bottom:8px;">
      ${title}
    </h2>
    <table
      style="
        border-collapse:collapse;
        width:100%;
        table-layout:fixed;
        font-family:sans-serif;
        color:#333;
        margin-bottom:16px;
      "
    >
      ${rows.map(
        ([label, val]) => `
        <tr>
          <th
            style="
              width:35%;
              text-align:left;
              padding:4px 8px;
              border-bottom:1px solid #eee;
              vertical-align:top;
            "
          >
            ${label}:
          </th>
          <td
            style="
              width:65%;
              text-align:right;
              padding:4px 8px;
              border-bottom:1px solid #eee;
              vertical-align:top;
            "
          >
            ${val || "—"}
          </td>
        </tr>`
      ).join("")}
    </table>`;



  /** Builds the UTM/GCLID tracking block for admin */
  const buildTrackingBlock = () => {
    const utmKeys = [
      { key: 'utm_source',    label: 'UTM Source'   },
      { key: 'utm_medium',    label: 'UTM Medium'   },
      { key: 'utm_campaign',  label: 'UTM Campaign' },
      { key: 'utm_term',      label: 'UTM Term'     },
      { key: 'utm_content',   label: 'UTM Content'  },
      { key: 'gclid',         label: 'GCLID'        },
    ];
  
    const rows = utmKeys.map(({key, label}) => [
      label,
      localStorage.getItem(key) || '—'
    ]);
  
    return `
      <h2 style="font-family:sans-serif;color:#333;margin-bottom:8px;">
        Tracking Lead Source
      </h2>
      <table
        style="
          border-collapse:collapse;
          width:100%;
          table-layout:fixed;
          font-family:sans-serif;
          color:#333;
          margin-bottom:16px;
        "
      >
        ${rows.map(
          ([label, val]) => `
          <tr>
            <th
              style="
                width:35%;
                text-align:left;
                padding:4px 8px;
                border-bottom:1px solid #eee;
                vertical-align:top;
              "
            >
              ${label}:
            </th>
            <td
              style="
                width:65%;
                text-align:right;
                padding:4px 8px;
                border-bottom:1px solid #eee;
                vertical-align:top;
              "
            >
              ${val}
            </td>
          </tr>`
        ).join('')}
      </table>`;
  };
  

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
    const personalRows = [
      ["First Name", data.firstName],
      ["Last Name",  data.lastName],
      ["Company (if applicable)", data.company],
      ["Email Address", data.email],
      ["Phone Number", data.phone],
    ];
    
    const addressRows = [
      ["Street Address", data.address],
      ["City",           data.city],
      ["Province",       data.province],
      ["Postal Code",    data.postal],
    ];
    
    const propertyRows = [
      ["Industry",                  data.industry],
      ["Square Footage",            data.squareFootage],
      ["Number of Levels",          data.levels],
      ["Number of Bedrooms",        data.bedrooms],
      ["Number of Full Bathrooms",  data.bathrooms],
      ["Number of Powder Rooms",    data.powderRooms],
      ["Number of People in Household", data.people],
    ];
    
    const servicesRows = [
      ["Property Type",               data.propertyType],
      ["Booking Type",                data.bookingType],
      ["Cleaning Frequency",          data.frequency],
      ["Type of Cleaning Needed",     data.reason],
      ["First-Time Deep Cleaning",    data.firstTimeDeepCleaning],
      ["When last was the house professionally cleaned?", data.lastCleaned],
      ["Year Built",                  data.builtYear],
      ["Last Renovated",              data.lastRenovated],
      ["Pets in Home",                data.pets],
      ["Is the Property Furnished?",  data.furnished],
      ["Time Package (Recurring Only)", data.package],
      ["Interior Windows",            data.interiorWindows],
      ["Inside Empty Kitchen Cabinets", data.insideEmptyKitchenCabinets],
      ["Extras (One-Time Only)", 
        Array.isArray(data.extras)
          ? "<br>" + data.extras.map(x => `• ${x}`).join("<br>")
          : data.extras
      ],      
    ];
    
    const schedulingRows = [
      ["Preferred Cleaning Date(s)", data.date],
      ["Access Method",              data.accessMethod],
      ["Access Instructions",        data.accessDetails],
      ["Additional Notes",           data.details],
    ];
    
    const marketingRows = [
      ["How Did You Hear About Us?", data.hearAbout],
      ["Referral Name",              data.referralName],
    ];
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


   // build one table per section, each with its own heading
  const sectionsHtml = [
    buildBaseHtml("Personal & Contact", personalRows),
    buildBaseHtml("Property Address",     addressRows),
    buildBaseHtml("Property Details",     propertyRows),
    buildBaseHtml("Services Requested",   servicesRows),
    buildBaseHtml("Scheduling & Notes",   schedulingRows),
    buildBaseHtml("Marketing",            marketingRows)
  ].join("");

  // then tuck in images + tracking
  const adminHtml = `
    ${sectionsHtml}
    ${buildImageSection(imageUrls, folder)}
    ${buildTrackingBlock()}
  `;

    await sendEmail(ADMIN_TEMPLATE_ID, {
      lead_name: `${data.firstName} ${data.lastName}`.trim(),
      message:   adminHtml
    });

    // 5) Compose & send Client confirmation email
    const clientHtml = sectionsHtml
    return sendEmail(CLIENT_TEMPLATE_ID, {
      to_email:  data.email || "marinusdebeer@gmail.com",
      from_name: "Zen Zone Cleaning Services",
      to_name:   data.firstName || "Client",
      message:   clientHtml
    });
  }

  return { sendBookingRequest };
})();
