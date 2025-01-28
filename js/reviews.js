// reviews.js

document.addEventListener("DOMContentLoaded", () => {
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
