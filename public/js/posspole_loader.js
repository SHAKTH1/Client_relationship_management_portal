let loaderVisible = false; // Flag to check if the loader is visible
const displayThreshold = 200; // Delay in milliseconds before showing the loader
let loaderTimeout;

// Function to create the loader dynamically
function createLoader() {
  if (loaderVisible) return; // Avoid duplicate loaders

  loaderVisible = true;

  // Create the loader overlay element
  const loaderOverlay = document.createElement("div");
  loaderOverlay.className = "loader-overlay";
  loaderOverlay.style.position = "fixed";
  loaderOverlay.style.top = "0";
  loaderOverlay.style.left = "0";
  loaderOverlay.style.width = "100%";
  loaderOverlay.style.height = "100%";
  loaderOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Semi-transparent background
  loaderOverlay.style.display = "flex";
  loaderOverlay.style.justifyContent = "center";
  loaderOverlay.style.alignItems = "center";
  loaderOverlay.style.zIndex = "9999";
  loaderOverlay.style.opacity = "0"; // Start invisible
  loaderOverlay.style.transition = "opacity 0.3s ease-in-out"; // Smooth fade-in

  // Create the GIF element
  const loaderGif = document.createElement("img");
  loaderGif.className = "loader-gif";
  loaderGif.src = "./assets/posspole_loader.gif"; // Replace with the correct path to your GIF
  loaderGif.alt = "Loading...";
  loaderGif.style.width = "120px"; // Adjust size as needed
  loaderGif.style.height = "auto";

  // Append the GIF to the overlay
  loaderOverlay.appendChild(loaderGif);

  // Append the overlay to the body
  document.body.appendChild(loaderOverlay);

  // Add fade-in effect
  requestAnimationFrame(() => {
    loaderOverlay.style.opacity = "1";
  });
}

// Function to remove the loader dynamically
function removeLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");

  if (loaderOverlay && loaderVisible) {
    // Add fade-out effect
    loaderOverlay.style.opacity = "0";

    // Remove the loader from DOM after fade-out
    setTimeout(() => {
      loaderOverlay.remove();
      loaderVisible = false;
    }, 300); // Match fade-out duration
  }

  // Clear any pending timeout for showing the loader
  clearTimeout(loaderTimeout);
}

// Optimized event listeners for loaders
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page content loaded.");
  // Start a timer to show the loader only if content takes longer to load
  loaderTimeout = setTimeout(() => {
    createLoader();
  }, displayThreshold);
});

window.addEventListener("load", () => {
  console.log("All resources fully loaded. Removing loader...");
  removeLoader();
});

// Clear loaderTimeout if loading is fast
window.onload = () => {
  clearTimeout(loaderTimeout);
};
