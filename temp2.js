document.addEventListener('DOMContentLoaded', () => {
  // ============================
  // EmailJS Configuration
  // ============================
  const userID = '9CwBWUPI_pCtZXPr0';
  const serviceID = 'service_156d2p8';
  const formTemplateID = 'template_i7i7zz7';
  const confirmationTemplateID = 'template_nrcx4ff';

  // Initialize EmailJS with your user ID
  emailjs.init(userID);

  // ============================
  // Modal Elements
  // ============================
  const bookingModal = document.getElementById('modalBg'); // Booking form modal
  const termsModal = document.getElementById('termsModal'); // Terms of Service modal
  const privacyModal = document.getElementById('privacyModal'); // Privacy Policy modal
  const statusModalBg = document.getElementById('statusModalBg'); // Success/Error modal

  // Buttons to open the booking modal
  const openBookingButtons = document.querySelectorAll('#openModal, #openModal2'); // "Book Online" and "Get Your Free Quote"

  // Close buttons for the booking modal
  const closeBookingBtn = document.getElementById('closeModal');

  // Buttons to open Terms and Privacy modals
  const openTermsModalBtn = document.getElementById('openTermsModal');
  const openPrivacyModalBtn = document.getElementById('openPrivacyModal');

  // Close buttons for Terms and Privacy modals
  const closeTermsModalBtn = document.getElementById('closeTermsModal');
  const closePrivacyModalBtn = document.getElementById('closePrivacyModal');

  // Close button for Success/Error modal
  const statusModalCloseBtn = document.getElementById('statusModalClose');

  // Booking form
  const bookingForm = document.getElementById('bookingForm');

  // Service-specific modals
  const serviceModals = document.querySelectorAll('.service-modal'); // All service modals
  const learnMoreButtons = document.querySelectorAll('.learn-more-btn'); // "Learn More" buttons
  const bookNowButtons = document.querySelectorAll('.cta-button.book-now'); // "Book Now" buttons inside service modals

  // Dropdown in booking form
  const serviceDropdown = document.getElementById('service');

  // ============================
  // Utility Functions
  // ============================

  /**
   * Opens a modal by setting its display to 'flex' and adds the 'modal-open' class to body
   * @param {HTMLElement} modal - The modal element to open
   */
  const openModal = (modal) => {
    if (modal) {
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
  };

  /**
   * Closes a modal by setting its display to 'none' and removes the 'modal-open' class from body
   * @param {HTMLElement} modal - The modal element to close
   */
  const closeModalFunction = (modal) => {
    if (modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  };

  /**
   * Shows the status modal with a message and color based on success or error
   * @param {string} message - The message to display
   * @param {boolean} isSuccess - Flag indicating if it's a success or error message
   */
  const showStatusModal = (message, isSuccess) => {
    const statusModalContent = document.getElementById('statusModalContent');
    statusModalContent.innerHTML = `
      <h2 id="statusModalTitle" style="color: ${isSuccess ? '#78a265' : '#e63946'};">${isSuccess ? 'Success' : 'Error'}</h2>
      <p>${message}</p>
    `;
    openModal(statusModalBg);
  };

  /**
   * Pre-fills the service dropdown in the booking form
   * @param {string} serviceName - The name of the service to pre-fill
   */
  const prefillService = (serviceName) => {
    serviceDropdown.value = serviceName;
  };

  /**
   * Updates the progress bar based on the current step
   * @param {number} step - The current step number
   * @param {number} totalSteps - Total number of steps
   */
  const updateProgressBar = (step, totalSteps) => {
    const progress = document.querySelector('.progress');
    const percentage = ((step - 1) / (totalSteps - 1)) * 100;
    progress.style.width = `${percentage}%`;
  };

  // ============================
  // Event Listeners
  // ============================

  // Open Booking Modal from "Book Online" and "Get Your Free Quote" buttons
  openBookingButtons.forEach(button => {
    button.addEventListener('click', () => {
      openModal(bookingModal);
      // Reset form steps and progress
      const allSteps = bookingForm.querySelectorAll('.form-step');
      allSteps.forEach(step => step.classList.remove('active'));
      allSteps[0].classList.add('active');
      updateProgressBar(1, allSteps.length);
    });
  });

  // Close Booking Modal
  closeBookingBtn.addEventListener('click', () => {
    closeModalFunction(bookingModal);
  });

  // Open Terms of Service Modal
  openTermsModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(termsModal);
  });

  // Open Privacy Policy Modal
  openPrivacyModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(privacyModal);
  });

  // Close Terms of Service Modal
  closeTermsModalBtn.addEventListener('click', () => {
    closeModalFunction(termsModal);
  });

  // Close Privacy Policy Modal
  closePrivacyModalBtn.addEventListener('click', () => {
    closeModalFunction(privacyModal);
  });

  // Close Success/Error Modal
  statusModalCloseBtn.addEventListener('click', () => {
    closeModalFunction(statusModalBg);
  });

  // Open Service Modals via "Learn More" buttons
  learnMoreButtons.forEach(button => {
    button.addEventListener('click', () => {
      const serviceKey = button.getAttribute('data-service'); // Get the sanitized service name
      const modalID = `serviceModal${serviceKey}`; // Construct the modal ID
      const serviceModal = document.getElementById(modalID); // Find the modal by ID

      if (serviceModal) {
        openModal(serviceModal);
      } else {
        console.error(`Modal with ID "${modalID}" not found.`);
      }
    });
  });

  // Close Service Modals
  serviceModals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      closeModalFunction(modal);
    });
  });

  // "Book Now" buttons inside service modals
  bookNowButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Find the closest service modal
      const currentServiceModal = button.closest('.service-modal');
      if (!currentServiceModal) return;

      // Extract the service name from the modal's title
      const serviceName = currentServiceModal.querySelector('h2').innerText;

      // Close the current service modal
      closeModalFunction(currentServiceModal);

      // Pre-fill the service dropdown in the booking form
      prefillService(serviceName);

      // Open the booking form modal
      openModal(bookingModal);

      // Set the form to the second step (Service Selection)
      const allSteps = bookingForm.querySelectorAll('.form-step');
      allSteps.forEach(step => step.classList.remove('active'));
      allSteps[1].classList.add('active');
      updateProgressBar(2, allSteps.length);
    });
  });

  // Close any modal when clicking outside the modal content
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-bg')) {
      closeModalFunction(e.target);
    }
  });

  // Close any modal when pressing the 'Escape' key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-bg[style*="display: flex"]');
      openModals.forEach(modal => {
        closeModalFunction(modal);
      });
    }
  });

  // Handle Multi-Step Form Navigation
  const formSteps = bookingForm.querySelectorAll('.form-step');
  const nextBtns = bookingForm.querySelectorAll('.next-btn');
  const prevBtns = bookingForm.querySelectorAll('.prev-btn');

  nextBtns.forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = bookingForm.querySelector('.form-step.active');
      const currentStepNum = parseInt(currentStep.getAttribute('data-step'));
      const nextStepNum = currentStepNum + 1;
      const nextStep = bookingForm.querySelector(`.form-step[data-step="${nextStepNum}"]`);

      if (nextStep) {
        // Validate current step before proceeding
        const inputs = currentStep.querySelectorAll('input, select, textarea');
        let isValid = true;
        inputs.forEach(input => {
          if (!input.checkValidity()) {
            input.reportValidity();
            isValid = false;
          }
        });

        if (isValid) {
          currentStep.classList.remove('active');
          nextStep.classList.add('active');
          updateProgressBar(nextStepNum, formSteps.length);
        }
      }
    });
  });

  prevBtns.forEach(button => {
    button.addEventListener('click', () => {
      const currentStep = bookingForm.querySelector('.form-step.active');
      const currentStepNum = parseInt(currentStep.getAttribute('data-step'));
      const prevStepNum = currentStepNum - 1;
      const prevStep = bookingForm.querySelector(`.form-step[data-step="${prevStepNum}"]`);

      if (prevStep) {
        currentStep.classList.remove('active');
        prevStep.classList.add('active');
        updateProgressBar(prevStepNum, formSteps.length);
      }
    });
  });

  // Handle Booking Form Submission
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate the final step before submission
      const currentStep = bookingForm.querySelector('.form-step.active');
      const inputs = currentStep.querySelectorAll('input, select, textarea');
      let isValid = true;
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.reportValidity();
          isValid = false;
        }
      });

      if (!isValid) return;

      // Collect all form data
      const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        details: document.getElementById('details').value.trim() || 'None',
        squareFootage: document.getElementById('squareFootage').value,
        bedrooms: document.getElementById('bedrooms').value,
        bathrooms: document.getElementById('bathrooms').value,
        powderRooms: document.getElementById('powderRooms').value,
      };

      // Disable the submit button and show loading state
      const submitBtn = bookingForm.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Send the form submission email to your business
      emailjs.send(serviceID, formTemplateID, formData)
        .then(() => {
          console.log('Form submission email sent successfully!');

          // Send confirmation email to the user
          const confirmationData = {
            to_name: formData.name,
            to_email: formData.email,
            service: formData.service,
            date: formData.date,
          };

          return emailjs.send(serviceID, confirmationTemplateID, confirmationData);
        })
        .then(() => {
          console.log('Confirmation email sent successfully!');

          // Hide booking form modal
          closeModalFunction(bookingModal);

          // Show success modal
          showStatusModal('Your request has been submitted successfully. We will contact you shortly.', true);

          // Reset the form
          bookingForm.reset();

          // Reset progress bar
          const allSteps = bookingForm.querySelectorAll('.form-step');
          allSteps.forEach(step => step.classList.remove('active'));
          allSteps[0].classList.add('active');
          updateProgressBar(1, allSteps.length);

          // Re-enable the submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Quote Request';
        })
        .catch((error) => {
          console.error('Error sending emails:', error);

          // Hide booking form modal
          closeModalFunction(bookingModal);

          // Show error modal
          showStatusModal('Failed to submit your request. Please try again later.', false);

          // Re-enable the submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Quote Request';
        });
    });
  }
});
