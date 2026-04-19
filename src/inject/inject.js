setInterval(function () {
  document
    .querySelectorAll(
      "[data-testid='merge-request']:not([data-notification-button-initialized])",
    )
    .forEach(function (mr) {
      mr.dataset.notificationButtonInitialized = "true";

      const button = document.createElement("button");
      button.textContent = "N";
      button.classList.add("gitlab-notification-button");

      const cell = mr.querySelector("[role='cell']:last-child > div");
      if (cell) cell.appendChild(button);
    });
}, 1000);
