document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openModal');
  const openModalBtn2 = document.getElementById('openModal2');
  const closeModalBtn = document.getElementById('closeModal');
  const modalBg = document.getElementById('modalBg');
  const bookingForm = document.getElementById('bookingForm');
  const statusModalBg = document.getElementById('statusModalBg');
  const statusModalClose = document.getElementById('statusModalClose');
  const statusModalContent = document.getElementById('statusModalContent');

  // Handle "Book Online" button in navbar
  if (openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      modalBg.style.display = 'flex';
    });
  }

  // Handle "Request a Free Quote" button in hero
  if (openModalBtn2) {
    openModalBtn2.addEventListener('click', () => {
      modalBg.style.display = 'flex';
    });
  }

  // Close booking modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modalBg.style.display = 'none';
    });
  }

  // Close status modal
  if (statusModalClose) {
    statusModalClose.addEventListener('click', () => {
      statusModalBg.style.display = 'none';
    });
  }

  // Close modals by clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modalBg) {
      modalBg.style.display = 'none';
    }
    if (e.target === statusModalBg) {
      statusModalBg.style.display = 'none';
    }
  });

  // Function to show status modal
  const showStatusModal = (message, isSuccess) => {
    statusModalContent.innerHTML = `
      <h2 style="color: ${isSuccess ? '#78a265' : '#e63946'};">${isSuccess ? 'Success' : 'Error'}</h2>
      <p>${message}</p>
    `;
    statusModalBg.style.display = 'flex';
  };

  // Booking Form Submission
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate the form
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
      }

      // Initialize EmailJS
      emailjs.init('9CwBWUPI_pCtZXPr0');

      const serviceID = 'service_156d2p8';
      const formTemplateID = 'template_i7i7zz7';
      const confirmationTemplateID = 'template_nrcx4ff';

      const leadName = document.getElementById('name').value;
      const leadEmail = document.getElementById('email').value;
      const leadPhone = document.getElementById('phone').value;
      const leadAddress = document.getElementById('address').value;
      const leadService = document.getElementById('service').value;
      const leadDate = document.getElementById('date').value;
      const leadDetails = document.getElementById('details').value || 'None';

      const leadMessage = `
        Name: ${leadName}
        Email: ${leadEmail}
        Phone: ${leadPhone}
        Address: ${leadAddress}
        Service: ${leadService}
        Preferred Date: ${leadDate}
        Additional Details: ${leadDetails}
      `;

      // Send the form submission email
      emailjs
        .send(serviceID, formTemplateID, { message: leadMessage })
        .then(() => {
          console.log('Form submission email sent successfully!');

          // Send confirmation email
          emailjs
            .send(serviceID, confirmationTemplateID, {
              to_name: leadName,
              to_email: leadEmail,
              message: leadMessage,
            })
            .then(() => {
              console.log('Confirmation email sent!');
              // Hide form modal
              modalBg.style.display = 'none';

              // Show success modal
              showStatusModal(
                'Your request has been submitted successfully. We will contact you shortly.',
                true
              );

              // Reset the form
              bookingForm.reset();
            })
            .catch((err) => {
              console.error('Error sending confirmation email:', err);
              // Hide form modal
              modalBg.style.display = 'none';

              // Show error modal
              showStatusModal(
                'Your request was submitted, but there was an issue sending the confirmation email. We will still contact you shortly.',
                false
              );
            });
        })
        .catch((formError) => {
          console.error('Error sending form submission email:', formError);

          // Hide form modal
          modalBg.style.display = 'none';

          // Show error modal
          showStatusModal(
            'Failed to send the form. Please try again later.',
            false
          );
        });
    });
  }
});
