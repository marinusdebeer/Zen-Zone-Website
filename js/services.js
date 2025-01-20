// document.addEventListener("DOMContentLoaded", () => {
//   fetchServices()
//     .then(renderServices)
//     .catch((error) => console.error("Error loading services:", error));
// });

// /**
//  * Fetch Services from JSON
//  */
// async function fetchServices() {
//   const response = await fetch("data/services.json");
//   if (!response.ok) {
//     throw new Error(`HTTP error! Status: ${response.status}`);
//   }
//   return response.json();
// }

// /**
//  * Render Services into the Services Container
//  */
// function renderServices(services) {
//   const servicesContainer = document.querySelector(".services-hero-tiles");

//   servicesContainer.innerHTML = services
//     .map(
//       (service) => `
//       <div class="service-tile">
//         <h3>${service.title}</h3>
//         <p>${service.description}</p>
//         <button class="learn-more-btn" data-service="${service.id}" aria-label="Learn more about ${service.title}">
//           Learn More
//         </button>
//       </div>
//     `
//     )
//     .join("");

//   // Add event listeners to Learn More buttons
//   const learnMoreButtons = document.querySelectorAll(".learn-more-btn");
//   learnMoreButtons.forEach((button) => {
//     button.addEventListener("click", () => {
//       const serviceId = button.getAttribute("data-service");
//       openModal(`serviceModal${serviceId}`);
//     });
//   });
// }
