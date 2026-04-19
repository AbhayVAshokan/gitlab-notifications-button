const bellIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-animated-icon gl-animated-icon-off gl-animated-icon-current !gl-text-status-info"><path d="M3.72 11.25L2.35519 12.837C2.21579 12.9991 2.33095 13.25 2.54473 13.25H13.4428C13.6586 13.25 13.773 12.995 13.6296 12.8338L12.22 11.25V7C12.22 6.06556 11.9184 5.20155 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-bottom-part"></path> <path d="M3.72 11.75V7C3.72 4.65279 5.62279 2.75 7.97 2.75C9.38277 2.75 10.6345 3.43933 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-top-part"></path> <path d="M1.75 14.25L14.2461 1.75391" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-line"></path> <path d="M6 13H10V13C10 14.1046 9.10457 15 8 15V15C6.89543 15 6 14.1046 6 13V13Z" fill="currentColor"></path> <path d="M7 2C7 1.44772 7.44772 1 8 1V1C8.55228 1 9 1.44772 9 2V2C9 2.55228 8.55228 3 8 3V3C7.44772 3 7 2.55228 7 2V2Z" fill="currentColor"></path></svg>`;

setInterval(function () {
  document
    .querySelectorAll(
      "[data-testid='merge-request']:not([data-notification-button-initialized])",
    )
    .forEach(function (mr) {
      mr.dataset.notificationButtonInitialized = "true";

      const button = document.createElement("button");
      button.innerHTML = bellIcon;
      button.classList.add("hide-collapsed", "btn-icon", "!gl-align-top", "btn", "gl-button", "btn-default", "btn-md", "btn-default-secondary");

      const lastCell = mr.querySelector("[role='cell']:last-child > div");
      if (lastCell) lastCell.appendChild(button);
    });
}, 1000);
