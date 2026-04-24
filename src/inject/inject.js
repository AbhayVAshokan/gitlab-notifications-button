const bellIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text gl-animated-icon gl-animated-icon-off gl-animated-icon-current !gl-text-status-info"><path d="M3.72 11.25L2.35519 12.837C2.21579 12.9991 2.33095 13.25 2.54473 13.25H13.4428C13.6586 13.25 13.773 12.995 13.6296 12.8338L12.22 11.25V7C12.22 6.06556 11.9184 5.20155 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-bottom-part"></path> <path d="M3.72 11.75V7C3.72 4.65279 5.62279 2.75 7.97 2.75C9.38277 2.75 10.6345 3.43933 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-top-part"></path> <path d="M1.75 14.25L14.2461 1.75391" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-line"></path> <path d="M6 13H10V13C10 14.1046 9.10457 15 8 15V15C6.89543 15 6 14.1046 6 13V13Z" fill="currentColor"></path> <path d="M7 2C7 1.44772 7.44772 1 8 1V1C8.55228 1 9 1.44772 9 2V2C9 2.55228 8.55228 3 8 3V3C7.44772 3 7 2.55228 7 2V2Z" fill="currentColor"></path></svg>`;

const bellOffIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text gl-animated-icon gl-animated-icon-on gl-animated-icon-current"><path d="M3.72 11.25L2.35519 12.837C2.21579 12.9991 2.33095 13.25 2.54473 13.25H13.4428C13.6586 13.25 13.773 12.995 13.6296 12.8338L12.22 11.25V7C12.22 6.06556 11.9184 5.20155 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-bottom-part"></path> <path d="M3.72 11.75V7C3.72 4.65279 5.62279 2.75 7.97 2.75C9.38277 2.75 10.6345 3.43933 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-top-part"></path> <path d="M1.75 14.25L14.2461 1.75391" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-line"></path> <path d="M6 13H10V13C10 14.1046 9.10457 15 8 15V15C6.89543 15 6 14.1046 6 13V13Z" fill="currentColor"></path> <path d="M7 2C7 1.44772 7.44772 1 8 1V1C8.55228 1 9 1.44772 9 2V2C9 2.55228 8.55228 3 8 3V3C7.44772 3 7 2.55228 7 2V2Z" fill="currentColor"></path></svg>`;

const deployIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text"><path d="M1 11.5L8 14.5L15 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 8L8 11L15 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 1.5L15 4.5L8 7.5L1 4.5L8 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const spinnerIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text" style="animation: glnb-spin 0.8s linear infinite; transform-origin: center"><style>@keyframes glnb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="28.3 9.4"/></svg>`;

const isMergedPage = () =>
  window.location.pathname === "/dashboard/merge_requests/merged";

const parseMrInfo = (mr) => {
  const link = mr.querySelector("a");
  if (!link) return null;
  const match = link.href.match(/gitlab\.com\/(.+?)\/-\/merge_requests\/(\d+)/);
  return { fullPath: match[1], iid: match[2] };
};

const getSubscribedStates = async (mergeRequests) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (!csrfToken) throw new Error("CSRF-Token cannot be extracted from DOM");

  const aliases = mergeRequests
    .map(
      ({ fullPath, iid }, i) => `
    mr${i}: project(fullPath: "${fullPath}") {
      mergeRequest(iid: "${iid}") {
        id
        subscribed
      }
    }
  `,
    )
    .join("\n");

  const query = `query { ${aliases} }`;

  const response = await fetch("https://gitlab.com/api/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();

  return mergeRequests.map((mr, i) => ({
    ...mr,
    subscribed: data[`mr${i}`]?.mergeRequest?.subscribed,
  }));
};

const toggleSubscription = async (fullPath, iid, currentlySubscribed) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  const mutation = `
    mutation {
      mergeRequestSetSubscription(input: {
        projectPath: "${fullPath}",
        iid: "${iid}",
        subscribedState: ${!currentlySubscribed}
      }) {
        mergeRequest {
          id
          subscribed
        }
        errors
      }
    }
  `;
  const response = await fetch("https://gitlab.com/api/graphql", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ query: mutation }),
  });
  const { data } = await response.json();
  const result = data?.mergeRequestSetSubscription;
  if (result?.errors?.length) throw new Error(result.errors.join(", "));
  return result?.mergeRequest?.subscribed;
};

const getMrEnvironments = async (fullPath, iid) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  const [namespace, ...projectParts] = fullPath.split("/");
  const project = projectParts.join("/");
  const url = new URL(
    `https://gitlab.com/${namespace}/${project}/-/merge_requests/${iid}/ci_environments_status`,
  );
  url.searchParams.set("environment_target", "merge_commit");
  const response = await fetch(url.toString(), {
    credentials: "include",
    headers: { "X-CSRF-Token": csrfToken },
  });
  return response.json();
};

const insertNotificationButton = (mr, isSubscribed) => {
  const info = parseMrInfo(mr);
  let subscribed = isSubscribed;

  const button = document.createElement("button");
  button.innerHTML = subscribed ? bellIcon : bellOffIcon;
  button.classList.add(
    "hide-collapsed",
    "btn-icon",
    "!gl-align-top",
    "btn",
    "gl-button",
    "btn-default",
    "btn-md",
    "btn-default-secondary",
  );

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.innerHTML = spinnerIcon;
    subscribed = await toggleSubscription(info.fullPath, info.iid, subscribed);
    button.innerHTML = subscribed ? bellIcon : bellOffIcon;
    button.disabled = false;
  });

  const lastCell = mr.querySelector("[role='cell']:last-child > div");
  if (lastCell) lastCell.appendChild(button);

  const ciIcon = mr.querySelector("a.ci-icon");
  if (ciIcon) ciIcon.style.alignSelf = "center";
};

const insertEnvironmentsButton = (mr) => {
  const info = parseMrInfo(mr);

  const button = document.createElement("button");
  button.innerHTML = deployIcon;
  button.classList.add(
    "hide-collapsed",
    "btn-icon",
    "!gl-align-top",
    "btn",
    "gl-button",
    "btn-default",
    "btn-md",
    "btn-default-secondary",
  );

  let popover = null;

  const closePopover = () => {
    popover?.remove();
    popover = null;
    document.removeEventListener("click", onOutsideClick);
  };

  const onOutsideClick = (e) => {
    if (!popover?.contains(e.target) && e.target !== button) closePopover();
  };

  button.addEventListener("click", async (e) => {
    e.stopPropagation();

    if (popover) {
      closePopover();
      return;
    }

    button.disabled = true;
    button.innerHTML = spinnerIcon;
    const environments = await getMrEnvironments(info.fullPath, info.iid);
    button.innerHTML = deployIcon;
    button.disabled = false;

    const successful = environments.filter((env) => env.status === "success");

    popover = document.createElement("div");
    popover.style.cssText = `
      position: absolute;
      z-index: 9999;
      background: var(--gl-background-color-default, #fff);
      border: 1px solid var(--gl-border-color-default, #ddd);
      border-radius: 4px;
      padding: 8px 0;
      min-width: 220px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 13px;
    `;

    if (successful.length === 0) {
      popover.innerHTML = `<div style="padding: 6px 12px; color: var(--gl-text-color-subtle, #666);">No successful deployments</div>`;
    } else {
      popover.innerHTML = successful
        .map(
          (env) => `
          <a href="https://gitlab.com${env.url}" target="_blank" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            text-decoration: none;
            color: var(--gl-text-color-default, inherit);
            gap: 12px;
          " onmouseover="this.style.background='var(--gl-background-color-subtle, #f5f5f5)'" onmouseout="this.style.background=''">
            <span style="font-weight: 500;">${env.name}</span>
            <span style="color: var(--gl-text-color-subtle, #666); font-size: 12px; white-space: nowrap;">${env.deployed_at_formatted}</span>
          </a>
        `,
        )
        .join("");
    }

    const rect = button.getBoundingClientRect();
    document.body.appendChild(popover);
    popover.style.top = `${rect.bottom + window.scrollY + 4}px`;
    popover.style.left = `${rect.left + window.scrollX - popover.offsetWidth + rect.width}px`;

    document.addEventListener("click", onOutsideClick);
  });

  const lastCell = mr.querySelector("[role='cell']:last-child > div");
  if (lastCell) lastCell.appendChild(button);

  const ciIcon = mr.querySelector("a.ci-icon");
  if (ciIcon) ciIcon.style.alignSelf = "center";
};

const processUninitializedMrs = async () => {
  const mrs = Array.from(
    document.querySelectorAll(
      "[data-testid='merge-request']:not([data-notification-button-initialized])",
    ),
  );

  if (mrs.length === 0) return;

  mrs.forEach((mr) => (mr.dataset.notificationButtonInitialized = "true"));

  if (isMergedPage()) {
    mrs.forEach(insertEnvironmentsButton);
    return;
  }

  const results = await getSubscribedStates(mrs.map(parseMrInfo));

  const subscribedByKey = Object.fromEntries(
    results.map(({ fullPath, iid, subscribed }) => [
      `${fullPath}/${iid}`,
      subscribed,
    ]),
  );

  mrs.forEach((mr) => {
    const info = parseMrInfo(mr);
    const subscribed = info
      ? (subscribedByKey[`${info.fullPath}/${info.iid}`] ?? false)
      : false;
    insertNotificationButton(mr, subscribed);
  });
};

const observer = new MutationObserver(processUninitializedMrs);

observer.observe(document.querySelector(".panel-content") ?? document.body, {
  childList: true,
  subtree: true,
});

processUninitializedMrs();
