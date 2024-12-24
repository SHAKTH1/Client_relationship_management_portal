let loaderVisible = false; // Tracks loader visibility
let activeProcesses = 0; // Tracks ongoing fetches or dynamic updates
const fadeDuration = 300; // Fade-in/out duration
const displayThreshold = 500; // Loader debounce threshold

// Function: Create loader
function createLoader() {
  if (loaderVisible) return;

  loaderVisible = true;

  const loaderOverlay = document.createElement("div");
  loaderOverlay.className = "loader-overlay";
  loaderOverlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity ${fadeDuration}ms ease-in-out;
    pointer-events: none; /* Ensures loader does not block clicks */
  `;

  const loaderGif = document.createElement("img");
  loaderGif.src = "./assets/posspole_loader.gif"; // Replace with your loader GIF path
  loaderGif.alt = "Loading...";
  loaderGif.style = "width: 120px; height: auto;";
  loaderOverlay.appendChild(loaderGif);

  document.body.appendChild(loaderOverlay);

  requestAnimationFrame(() => {
    loaderOverlay.style.opacity = "1"; // Fade-in effect
  });
}

// Function: Remove loader
function removeLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");
  if (loaderOverlay) {
    loaderOverlay.style.opacity = "0"; // Fade-out effect
    setTimeout(() => {
      loaderOverlay.remove();
      loaderVisible = false;
    }, fadeDuration);
  }
}

// Monitor dynamic fetch requests
function monitorFetchRequests() {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    activeProcesses++;
    if (!loaderVisible) createLoader();

    try {
      const response = await originalFetch(...args);
      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error; // Re-throw the error to propagate it
    } finally {
      activeProcesses--;
      if (activeProcesses === 0) removeLoader();
    }
  };
}

// Monitor DOM changes for dynamic content
function monitorDOMChanges() {
  const observer = new MutationObserver(
    debounce((mutations) => {
      const isRelevantChange = mutations.some(
        (mutation) =>
          mutation.type === "childList" &&
          !mutation.target.classList.contains("loader-overlay") &&
          mutation.addedNodes.length > 0
      );

      if (isRelevantChange) {
        activeProcesses++;
        if (!loaderVisible) createLoader();

        // Simulate rendering completion
        setTimeout(() => {
          activeProcesses--;
          if (activeProcesses === 0) removeLoader();
        }, 1000); // Adjust based on your rendering delay
      }
    }, displayThreshold)
  );

  observer.observe(document.body, { childList: true, subtree: true });
}

// Debounce utility
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Initialize loader monitoring
function initializeLoader() {
  monitorFetchRequests();
  monitorDOMChanges();
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", initializeLoader);
