// reviews.js

document.addEventListener("DOMContentLoaded", () => {
  initializeReviewsNavigation();
  makeReviewsClickable();
});

/**
 * Make review cards clickable to open the Google Business Profile
 */
function makeReviewsClickable() {
  const googleBusinessURL = "https://maps.app.goo.gl/EyMWdSuMsExvrxaG7"; // Your Google Business Profile URL
  const reviewCards = document.querySelectorAll(".review");

  reviewCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent redirect if the click is on a button or link inside the card
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.tagName.toLowerCase() === "label"
      ) {
        return; // Do nothing, allowing the button/link to function normally
      }

      // Open the Google Business Profile in a new tab
      window.open(googleBusinessURL, "_blank", "noopener,noreferrer");
    });

    // Enhance Accessibility by allowing keyboard navigation
    card.setAttribute("tabindex", "0"); // Make the card focusable
    card.setAttribute("role", "button"); // Indicate the role

    // Handle 'Enter' and 'Space' key presses
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.open(googleBusinessURL, "_blank", "noopener,noreferrer");
      }
    });
  });
}

/**
 * Setup Navigation Arrows Functionality
 */
function initializeReviewsNavigation() {
  const leftArrow = document.querySelector(".reviews-nav.left");
  const rightArrow = document.querySelector(".reviews-nav.right");
  const reviewsContainer = document.querySelector(".reviews-container");

  if (!leftArrow || !rightArrow || !reviewsContainer) {
    console.error("Reviews navigation elements not found.");
    return;
  }

  /**
   * Determine current scroll direction based on screen size
   * @returns {string} 'vertical' or 'horizontal'
   */
  const getScrollDirection = () => {
    return window.innerWidth >= 1024 ? "vertical" : "horizontal";
  };

  /**
   * Calculate the amount to scroll based on review card size and layout
   * @returns {number} Scroll amount in pixels
   */
  const calculateScrollAmount = () => {
    const direction = getScrollDirection();
    const reviewCard = reviewsContainer.querySelector(".review");
    if (reviewCard) {
      const cardStyle = window.getComputedStyle(reviewCard);
      const cardSize =
        direction === "vertical" ? reviewCard.offsetHeight : reviewCard.offsetWidth;
      const gap = direction === "vertical"
        ? parseInt(cardStyle.marginBottom) || 20
        : parseInt(cardStyle.marginRight) || 20;
      return cardSize + gap;
    }
    return 320; // Fallback value if no review cards found
  };

  let scrollAmount = calculateScrollAmount();

  /**
   * Update scroll amount and arrows based on screen size
   */
  const updateSettings = () => {
    scrollAmount = calculateScrollAmount();
    updateArrowsVisibility();
    rotateArrows(); // Rotate arrows based on direction
  };

  /**
   * Rotate navigation arrows based on scroll direction
   */
  const rotateArrows = () => {
    const direction = getScrollDirection();
    if (direction === "vertical") {
      leftArrow.style.transform = "translateY(-50%) rotate(90deg)"; // Point upwards
      rightArrow.style.transform = "translateY(-50%) rotate(-90deg)"; // Point downwards
      leftArrow.setAttribute("aria-label", "Scroll reviews up");
      rightArrow.setAttribute("aria-label", "Scroll reviews down");
    } else {
      leftArrow.style.transform = "translateY(-50%) rotate(0deg)"; // Point left
      rightArrow.style.transform = "translateY(-50%) rotate(0deg)"; // Point right
      leftArrow.setAttribute("aria-label", "Scroll reviews left");
      rightArrow.setAttribute("aria-label", "Scroll reviews right");
    }
  };

  /**
   * Function to update the visibility of navigation arrows based on scroll position
   */
  const updateArrowsVisibility = () => {
    const direction = getScrollDirection();
    if (direction === "vertical") {
      const maxScrollTop = reviewsContainer.scrollHeight - reviewsContainer.clientHeight;
      leftArrow.style.display = reviewsContainer.scrollTop > 0 ? "flex" : "none";
      rightArrow.style.display =
        reviewsContainer.scrollTop < maxScrollTop ? "flex" : "none";
    } else {
      const maxScrollLeft = reviewsContainer.scrollWidth - reviewsContainer.clientWidth;
      leftArrow.style.display = reviewsContainer.scrollLeft > 0 ? "flex" : "none";
      rightArrow.style.display =
        reviewsContainer.scrollLeft < maxScrollLeft ? "flex" : "none";
    }
  };

  /**
   * Event listener for navigation arrows
   */
  const handleArrowClick = (direction) => {
    const currentDirection = getScrollDirection();
    const scrollOptions =
      currentDirection === "vertical"
        ? { top: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" }
        : { left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" };
    reviewsContainer.scrollBy(scrollOptions);
  };

  /**
   * Handle 'Enter' and 'Space' key presses on navigation arrows
   */
  const handleArrowKeyDown = (event, direction) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleArrowClick(direction);
    }
  };

  // Initial Settings
  updateSettings();

  // Update settings on window resize
  window.addEventListener("resize", updateSettings);

  // Event Listeners for Clicks
  leftArrow.addEventListener("click", () => handleArrowClick("left"));
  rightArrow.addEventListener("click", () => handleArrowClick("right"));

  // Event Listeners for Keyboard Navigation
  leftArrow.addEventListener("keydown", (event) => handleArrowKeyDown(event, "left"));
  rightArrow.addEventListener("keydown", (event) => handleArrowKeyDown(event, "right"));

  // Update arrow visibility on scroll
  reviewsContainer.addEventListener("scroll", updateArrowsVisibility);
}
