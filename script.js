document.addEventListener('DOMContentLoaded', () => {
  // ============================
  // Initialize Swiper.js for Gallery Carousel
  // ============================
  // const swiper = new Swiper('.swiper-container', {
  //   loop: true,
  //   autoplay: {
  //     delay: 5000,
  //     disableOnInteraction: false
  //   },
  //   pagination: {
  //     el: '.swiper-pagination',
  //     clickable: true
  //   },
  //   navigation: {
  //     nextEl: '.swiper-button-next',
  //     prevEl: '.swiper-button-prev'
  //   },
  //   a11y: {
  //     enabled: true,
  //     prevSlideMessage: 'Previous slide',
  //     nextSlideMessage: 'Next slide',
  //     paginationBulletMessage: 'Go to slide {{index}}'
  //   }
  // });

  // ============================
  // Initialize EmailJS
  // ============================
  emailjs.init('9CwBWUPI_pCtZXPr0');

  // ============================
  // Modal Handling
  // ============================

  // Function to open a modal
  const openModal = (modal) => {
    if (modal) {
      modal.style.display = 'flex';
      document.body.classList.add('modal-open'); // Prevent background scrolling
      trapFocus(modal); // Trap focus inside modal for accessibility
    }
  };

  // Function to close a modal
  const closeModal = (modal) => {
    if (modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open'); // Re-enable background scrolling
      releaseFocus(); // Release focus trap
    }
  };

  // Track the element that was focused before opening a modal
  let focusedElementBeforeModal;

  // Function to trap focus within a modal
  const trapFocus = (modal) => {
    focusedElementBeforeModal = document.activeElement;
    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    const focusableElements = modal.querySelectorAll(focusableElementsString);

    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstFocusableElement.focus();

    // Listen for TAB key events
    modal.addEventListener('keydown', handleTrapFocus);
  };

  // Keydown handler for focus trapping
  const handleTrapFocus = (e) => {
    const modal = e.currentTarget;
    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    const focusableElements = modal.querySelectorAll(focusableElementsString);

    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    // Handle Tab key
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }

    // Allow closing modal with Escape key
    if (e.key === 'Escape') {
      closeModal(modal);
    }
  };

  // Function to release focus trap and return focus to previously focused element
  const releaseFocus = () => {
    if (focusedElementBeforeModal) {
      focusedElementBeforeModal.focus();
    }
    // Remove all keydown listeners from any currently open modals
    const openModals = document.querySelectorAll('.modal-bg[style*="display: flex"]');
    openModals.forEach((modal) => {
      modal.removeEventListener('keydown', handleTrapFocus);
    });
  };

  // Open booking form modals
  const openBookingButtons = document.querySelectorAll('#openModal, #openModal2');
  openBookingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      openModal(document.getElementById('modalBg'));
      resetForm();
    });
  });

  // Open terms and privacy modals
  const openTermsModalBtn = document.getElementById('openTermsModal');
  const openPrivacyModalBtn = document.getElementById('openPrivacyModal');

  if (openTermsModalBtn) {
    openTermsModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(document.getElementById('termsModal'));
    });
  }

  if (openPrivacyModalBtn) {
    openPrivacyModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(document.getElementById('privacyModal'));
    });
  }

  // Event listeners to close modals via close buttons
  const closeModalButtons = document.querySelectorAll('.modal-close');
  closeModalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal-bg');
      closeModal(modal);
    });
  });

  // Close modals when clicking outside the modal content
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-bg')) {
      closeModal(e.target);
    }
  });

  // ============================
  // Service "Learn More" modals
  // ============================
  const learnMoreButtons = document.querySelectorAll('.learn-more-btn');
  learnMoreButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const service = button.getAttribute('data-service');
      const modalID = `serviceModal${service}`;
      const serviceModal = document.getElementById(modalID);
      if (serviceModal) {
        openModal(serviceModal);
      }
    });
  });

  // "Book Now" within service modals
  const bookNowButtons = document.querySelectorAll('.cta-button.book-now');
  bookNowButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const serviceModal = button.closest('.service-modal');
      if (serviceModal) {
        // Get service name from the modal’s <h2>
        const serviceName = serviceModal.querySelector('h2').innerText;
        // Close the current service modal
        closeModal(serviceModal);
        // Open booking modal
        openModal(document.getElementById('modalBg'));
        // Pre-fill the service selection
        const serviceSelect = document.getElementById('service');
        serviceSelect.value = serviceName;
      }
    });
  });

  // ============================
  // Blog "Read More" modals
  // ============================
  const readMoreBlogButtons = document.querySelectorAll('.learn-more-blog-btn');
  readMoreBlogButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const blog = button.getAttribute('data-blog');
      const modalID = `blogModal${blog}`;
      const blogModal = document.getElementById(modalID);
      if (blogModal) {
        openModal(blogModal);
      }
    });
  });

  // ============================
  // Booking Form: Multi-Step
  // ============================
  const bookingForm = document.getElementById('bookingForm');
  const formSteps = bookingForm.querySelectorAll('.form-step');
  const nextButtons = bookingForm.querySelectorAll('.next-btn');
  const prevButtons = bookingForm.querySelectorAll('.prev-btn');
  const progressBar = bookingForm.querySelector('.progress');

  let currentStep = 1;
  const totalSteps = formSteps.length;

  nextButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const currentFormStep = bookingForm.querySelector(`.form-step[data-step="${currentStep}"]`);
      if (validateStep(currentFormStep)) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  prevButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentStep--;
      showStep(currentStep);
    });
  });

  function showStep(step) {
    formSteps.forEach((formStep) => {
      const stepNum = parseInt(formStep.getAttribute('data-step'), 10);
      formStep.classList.toggle('active', stepNum === step);
    });

    // Update progress bar (steps - 1 because final step is 100%)
    const percentage = ((step - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${percentage}%`;
  }

  function validateStep(stepElement) {
    const inputs = stepElement.querySelectorAll('input, select, textarea');
    let isValid = true;
    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        input.reportValidity();
        isValid = false;
      }
    });
    return isValid;
  }

  function resetForm() {
    currentStep = 1;
    showStep(currentStep);
    bookingForm.reset();
    progressBar.style.width = '0%';
  }

  // ============================
  // Booking Form: Submission
  // ============================
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const currentFormStep = bookingForm.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (validateStep(currentFormStep)) {
      // Collect form data
      const formData = {
        name: bookingForm.querySelector('#name').value.trim(),
        email: bookingForm.querySelector('#email').value.trim(),
        phone: bookingForm.querySelector('#phone').value.trim(),
        service: bookingForm.querySelector('#service').value,
        squareFootage: bookingForm.querySelector('#squareFootage').value,
        bedrooms: bookingForm.querySelector('#bedrooms').value,
        bathrooms: bookingForm.querySelector('#bathrooms').value,
        powderRooms: bookingForm.querySelector('#powderRooms').value,
        address: bookingForm.querySelector('#address').value.trim(),
        date: bookingForm.querySelector('#date').value,
        details: bookingForm.querySelector('#details').value.trim()
      };

      // Disable submit button to avoid multiple submissions
      const submitBtn = bookingForm.querySelector('.submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Send booking form data via EmailJS
      emailjs.send('service_156d2p8', 'template_i7i7zz7', formData)
        .then((response) => {
          console.log('Booking form submitted successfully:', response.status, response.text);

          // Send confirmation email to user
          const confirmationData = {
            to_name: formData.name,
            to_email: formData.email,
            service: formData.service,
            date: formData.date
          };

          return emailjs.send('service_156d2p8', 'template_nrcx4ff', confirmationData);
        })
        .then((response) => {
          console.log('Confirmation email sent successfully:', response.status, response.text);
          // Show success modal
          showStatusModal('Your request has been submitted successfully. We will contact you shortly.', true);
          // Reset form
          resetForm();
          // Close booking modal
          closeModal(document.getElementById('modalBg'));
        })
        .catch((error) => {
          console.error('Error submitting booking form:', error);
          // Show error modal
          showStatusModal('Failed to submit your request. Please try again later.', false);
        })
        .finally(() => {
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Quote Request';
        });
    }
  });

  // ============================
  // Status Modal Handling
  // ============================
  const statusModal = document.getElementById('statusModalBg');
  const statusModalCloseBtn = document.getElementById('statusModalClose');

  const showStatusModal = (message, isSuccess) => {
    const statusContent = statusModal.querySelector('#statusModalContent');
    statusContent.innerHTML = `
      <h2>${isSuccess ? 'Success' : 'Error'}</h2>
      <p>${message}</p>
    `;
    openModal(statusModal);
  };

  // Close status modal via close button
  statusModalCloseBtn.addEventListener('click', () => {
    closeModal(statusModal);
  });

  // Close status modal when clicking outside content
  window.addEventListener('click', (e) => {
    if (e.target === statusModal) {
      closeModal(statusModal);
    }
  });
});
