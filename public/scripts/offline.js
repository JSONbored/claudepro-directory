// Check online status
function updateOnlineStatus() {
  const status = document.getElementById("status");
  if (navigator.onLine) {
    status.textContent = "✓ Connection restored - reloading...";
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } else {
    status.textContent = "✗ No internet connection";
  }
}

// Listen for online/offline events
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// Check status on load
updateOnlineStatus();

// Periodic check
setInterval(updateOnlineStatus, 5000);

// Manual retry functionality
window.retryConnection = function () {
  updateOnlineStatus();
  if (navigator.onLine) {
    window.location.reload();
  }
};
