const bellIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text gl-animated-icon gl-animated-icon-off gl-animated-icon-current !gl-text-status-info"><path d="M3.72 11.25L2.35519 12.837C2.21579 12.9991 2.33095 13.25 2.54473 13.25H13.4428C13.6586 13.25 13.773 12.995 13.6296 12.8338L12.22 11.25V7C12.22 6.06556 11.9184 5.20155 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-bottom-part"></path> <path d="M3.72 11.75V7C3.72 4.65279 5.62279 2.75 7.97 2.75C9.38277 2.75 10.6345 3.43933 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-top-part"></path> <path d="M1.75 14.25L14.2461 1.75391" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-line"></path> <path d="M6 13H10V13C10 14.1046 9.10457 15 8 15V15C6.89543 15 6 14.1046 6 13V13Z" fill="currentColor"></path> <path d="M7 2C7 1.44772 7.44772 1 8 1V1C8.55228 1 9 1.44772 9 2V2C9 2.55228 8.55228 3 8 3V3C7.44772 3 7 2.55228 7 2V2Z" fill="currentColor"></path></svg>`;

const bellOffIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="gl-button-icon gl-button-text gl-animated-icon gl-animated-icon-on gl-animated-icon-current"><path d="M3.72 11.25L2.35519 12.837C2.21579 12.9991 2.33095 13.25 2.54473 13.25H13.4428C13.6586 13.25 13.773 12.995 13.6296 12.8338L12.22 11.25V7C12.22 6.06556 11.9184 5.20155 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-bottom-part"></path> <path d="M3.72 11.75V7C3.72 4.65279 5.62279 2.75 7.97 2.75C9.38277 2.75 10.6345 3.43933 11.4073 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-top-part"></path> <path d="M1.75 14.25L14.2461 1.75391" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="gl-animated-notifications-line"></path> <path d="M6 13H10V13C10 14.1046 9.10457 15 8 15V15C6.89543 15 6 14.1046 6 13V13Z" fill="currentColor"></path> <path d="M7 2C7 1.44772 7.44772 1 8 1V1C8.55228 1 9 1.44772 9 2V2C9 2.55228 8.55228 3 8 3V3C7.44772 3 7 2.55228 7 2V2Z" fill="currentColor"></path></svg>`;

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

const insertButton = (mr, isSubscribed) => {
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
    subscribed = await toggleSubscription(info.fullPath, info.iid, subscribed);
    button.innerHTML = subscribed ? bellIcon : bellOffIcon;
    button.disabled = false;
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
    insertButton(mr, subscribed);
  });
};

const observer = new MutationObserver(processUninitializedMrs);

observer.observe(document.querySelector(".panel-content"), {
  childList: true,
  subtree: true,
});

processUninitializedMrs();
