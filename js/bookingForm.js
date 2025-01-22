// js/bookingForm.js

document.addEventListener("modalsLoaded", () => {
  initBookingForm();
});

/**
 * Initialize Booking Form Functionality
 */
function initBookingForm() {
  const bookingForm = document.getElementById("bookingForm");
  if (!bookingForm) {
    console.error("Booking form not found.");
    return;
  }

  const formSteps = bookingForm.querySelectorAll(".form-step");
  const progressBar = document.querySelector(".progress");
  const submitButton = bookingForm.querySelector(".submit-btn");

  let currentStep = 1;
  const totalSteps = formSteps.length;

  // Initialize EmailJS
  emailjs.init("9CwBWUPI_pCtZXPr0");

  // Show the first step
  showFormStep(currentStep);

  // Event delegation for next and previous buttons
  bookingForm.addEventListener("click", (e) => {
    if (e.target.classList.contains("next-btn")) {
      e.preventDefault();
      if (validateFormStep(currentStep)) {
        currentStep++;
        showFormStep(currentStep);
      }
    }

    if (e.target.classList.contains("prev-btn")) {
      e.preventDefault();
      currentStep--;
      showFormStep(currentStep);
    }
  });

  // Handle form submission
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateFormStep(currentStep)) {
      // Collect form data
      const formData = new FormData(bookingForm);
      const data = Object.fromEntries(formData.entries());

      // Send data via EmailJS
      sendBookingRequest(data);
    }
  });

  /**
   * Show the form step based on index
   */
  function showFormStep(step) {
    formSteps.forEach((formStep, index) => {
      formStep.classList.toggle("active", index + 1 === step);
    });

    // Update progress bar
    const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;
    if(progressBar)
      progressBar.style.width = `${progressPercent}%`;
  }

  /**
   * Validate current form step
   */
  function validateFormStep(step) {
    const currentFormStep = formSteps[step - 1];
    const inputs = currentFormStep.querySelectorAll("input, select, textarea");
    let valid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        valid = false;
        input.reportValidity();
        console.warn(`Invalid input: ${input.name}`);
      }
    });

    return valid;
  }

  /**
   * Reset the form to the first step
   */
  function resetForm() {
    currentStep = 1;
    showFormStep(currentStep);
    bookingForm.reset();
    progressBar.style.width = "0%";
  }

  /**
   * Send booking request using EmailJS
   */
  function sendBookingRequest(data) {
    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    // Prepare the EmailJS service for admin notification
    emailjs
      .send("service_156d2p8", "template_i7i7zz7", { ...data, message: constructAdminMessage(data) })
      .then(() => {

        // Prepare and send confirmation email to user
        const confirmationData = {
          to_name: data.name,
          to_email: data.email,
          service: data.service,
          date: data.date,
          message: constructUserMessage(data),
        };

        return emailjs.send("service_156d2p8", "template_nrcx4ff", confirmationData);
      })
      .then(() => {
        // Show success modal
        showStatusModal(
          "Your request has been submitted successfully. We will contact you shortly.",
          true
        );
        resetForm();
        closeModal(document.getElementById("modalBg"));
      })
      .catch((error) => {
        console.error("Error:", error.text || error);
        // Show error modal
        showStatusModal("Failed to submit your request. Please try again later.", false);
      })
      .finally(() => {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = "Submit Quote Request";
      });
  }

  /**
   * Construct the admin message from form data
   */
  function constructAdminMessage(data) {
    return `
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Service: ${data.service}
Square Footage: ${data.squareFootage} sq ft
Bedrooms: ${data.bedrooms}
Bathrooms: ${data.bathrooms}
Powder Rooms: ${data.powderRooms}
Address: ${data.address}
Preferred Date: ${data.date}
Additional Details: ${data.details || "N/A"}
    `.trim();
  }

  /**
   * Construct the user confirmation message
   */
  function constructUserMessage(data) {
    return `
Thank you for choosing Zen Zone Cleaning Services! Here’s a summary of your request:

Service: ${data.service}
Preferred Date: ${data.date}
Address: ${data.address}
Square Footage: ${data.squareFootage} sq ft
Bedrooms: ${data.bedrooms}
Bathrooms: ${data.bathrooms}
Powder Rooms: ${data.powderRooms}

Additional Details: ${data.details || "None provided"}
    `.trim();
  }

  /**
   * Show status modal with message
   */
  function showStatusModal(message, isSuccess) {
    const statusModalBg = document.getElementById("statusModalBg");
    const statusModalContent = document.getElementById("statusModalContent");

    statusModalContent.innerHTML = `
      <h2>${isSuccess ? "Success" : "Error"}</h2>
      <p>${message}</p>
    `;

    openModal("statusModalBg");

    // Automatically close after 5 seconds
    setTimeout(() => {
      closeModal(statusModalBg);
    }, 5000);
  }
}
