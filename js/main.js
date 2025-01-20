// js/main.js

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Swiper.js for any additional carousels if needed
  // const swiperElements = document.querySelectorAll('.swiper-container:not(.reviews-swiper)');
  // swiperElements.forEach((swiperEl) => {
  //   new Swiper(swiperEl, {
  //     loop: true,
  //     autoplay: {
  //       delay: 5000,
  //       disableOnInteraction: false,
  //     },
  //     pagination: {
  //       el: '.swiper-pagination',
  //       clickable: true,
  //     },
  //     navigation: {
  //       nextEl: '.swiper-button-next',
  //       prevEl: '.swiper-button-prev',
  //     },
  //     a11y: {
  //       enabled: true,
  //       prevSlideMessage: 'Previous slide',
  //       nextSlideMessage: 'Next slide',
  //       paginationBulletMessage: 'Go to slide {{index}}',
  //     },
  //   });
  // });

  // Smooth Scroll for Anchor Links
  const links = document.querySelectorAll('a[href^="#"]');
  const navbar = document.querySelector('.navbar'); // Adjust selector if different

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault(); // Prevent default jump

        // Dynamically get the height of the navbar
        const navbarHeight = navbar ? navbar.offsetHeight : 0;

        // Get the target element's position
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;

        // Smooth scroll to the adjusted position
        window.scrollTo({
          top: targetPosition - navbarHeight + 30, // Offset by the navbar's height
          behavior: 'smooth',
        });
      }
    });
  });
});
