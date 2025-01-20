// js/reviews.js

document.addEventListener("DOMContentLoaded", () => {
  initializeSwiper();
});

/**
 * Initialize Swiper.js for Reviews Carousel
 */
function initializeSwiper() {
  new Swiper(".reviews-swiper", {
    slidesPerView: 'auto',
    spaceBetween: 20,
    centeredSlides: true,
    pagination: { 
      el: ".swiper-pagination", 
      clickable: true 
    },
    navigation: { 
      nextEl: ".swiper-button-next", 
      prevEl: ".swiper-button-prev" 
    },
    loop: true,
    autoplay: { 
      delay: 5000, 
      disableOnInteraction: false 
    },
    a11y: {
      enabled: true,
      prevSlideMessage: "Previous review",
      nextSlideMessage: "Next review",
      slideLabelMessage: "{{index}} / {{slidesLength}}",
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 10
      },
      600: {
        slidesPerView: 'auto',
        spaceBetween: 20
      }
    }
  });
}
