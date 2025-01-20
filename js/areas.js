// // js/areas.js

// document.addEventListener("DOMContentLoaded", () => {
//   fetchAreas()
//     .then(renderAreas)
//     .catch((error) => console.error("Error loading areas:", error));
// });

// /**
//  * Fetch Areas from JSON
//  */
// async function fetchAreas() {
//   const response = await fetch("data/areas.json");
//   if (!response.ok) {
//     throw new Error(`HTTP error! Status: ${response.status}`);
//   }
//   const areas = await response.json();
//   return areas;
// }

// /**
//  * Render Areas into the Areas Container
//  */
// function renderAreas(areas) {
//   const areasContainer = document.querySelector(".areas-container");
  
//   areas.forEach((area) => {
//     const areaItem = document.createElement("div");
//     areaItem.classList.add("area-item");
//     areaItem.innerHTML = `
//       <img src="assets/${area.icon}" alt="${area.name} Icon" class="area-icon" loading="lazy" />
//       <h3>${area.name}</h3>
//       <p>${area.description}</p>
//     `;
//     areasContainer.appendChild(areaItem);
//   });
// }
