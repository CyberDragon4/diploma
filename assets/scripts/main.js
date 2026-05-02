const revealElements = document.querySelectorAll(".reveal");
const scrollButtons = document.querySelectorAll("[data-scroll]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.getAttribute("data-scroll");
    const target = document.querySelector(targetSelector);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const hero = document.querySelector(".hero");
const decorElements = document.querySelectorAll(".decor");

window.addEventListener("mousemove", (event) => {
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const { innerWidth, innerHeight } = window;
  const xRatio = (event.clientX / innerWidth - 0.5) * 2;
  const yRatio = (event.clientY / innerHeight - 0.5) * 2;

  decorElements.forEach((decor, index) => {
    const speed = (index + 1) * 2.4;
    decor.style.transform = `translate(${xRatio * speed}px, ${yRatio * speed}px)`;
  });
});

const portfolioTiles = document.querySelectorAll(".tile[data-product-id]");
const workingHoursElement = document.querySelector("[data-working-hours]");
const servicePriceItems = document.querySelectorAll("[data-service-id]");

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

function applyDefaultPortfolioPrices() {
  portfolioTiles.forEach((tile) => {
    const fallbackPrice = Number(tile.dataset.defaultPrice);
    const priceTarget = tile.querySelector("[data-price]");

    if (!priceTarget || Number.isNaN(fallbackPrice)) {
      return;
    }

    priceTarget.textContent = formatPrice(fallbackPrice);
  });
}

async function loadPortfolioPrices() {
  if (!portfolioTiles.length) {
    return;
  }

  // This global can be set later by admin integration code.
  const apiUrl = window.PORTFOLIO_PRICES_API;

  applyDefaultPortfolioPrices();

  if (!apiUrl) {
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const prices = payload?.prices;

    if (!prices || typeof prices !== "object") {
      return;
    }

    portfolioTiles.forEach((tile) => {
      const productId = tile.dataset.productId;
      const priceTarget = tile.querySelector("[data-price]");
      const apiPrice = Number(prices[productId]);

      if (!productId || !priceTarget || Number.isNaN(apiPrice)) {
        return;
      }

      priceTarget.textContent = formatPrice(apiPrice);
    });
  } catch (error) {
    // Keep default prices when API is unavailable.
  }
}

loadPortfolioPrices();

function applyDefaultServicePrices() {
  servicePriceItems.forEach((item) => {
    const fallbackPrice = Number(item.dataset.defaultPrice);
    const priceTarget = item.querySelector("[data-service-price]");

    if (!priceTarget || Number.isNaN(fallbackPrice)) {
      return;
    }

    priceTarget.textContent = formatPrice(fallbackPrice);
  });
}

async function loadServicePrices() {
  if (!servicePriceItems.length) {
    return;
  }

  // This global can be set later by admin integration code.
  const apiUrl = window.SERVICES_PRICES_API;

  applyDefaultServicePrices();

  if (!apiUrl) {
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const prices = payload?.servicePrices ?? payload?.prices?.services;

    if (!prices || typeof prices !== "object") {
      return;
    }

    servicePriceItems.forEach((item) => {
      const serviceId = item.dataset.serviceId;
      const priceTarget = item.querySelector("[data-service-price]");
      const apiPrice = Number(prices[serviceId]);

      if (!serviceId || !priceTarget || Number.isNaN(apiPrice)) {
        return;
      }

      priceTarget.textContent = formatPrice(apiPrice);
    });
  } catch (error) {
    // Keep default service prices when API is unavailable.
  }
}

loadServicePrices();

function applyDefaultWorkingHours() {
  if (!workingHoursElement) {
    return;
  }

  const fallbackHours = workingHoursElement.dataset.defaultWorkingHours;

  if (!fallbackHours) {
    return;
  }

  workingHoursElement.textContent = fallbackHours;
}

async function loadWorkingHours() {
  if (!workingHoursElement) {
    return;
  }

  // This global can be set later by admin integration code.
  const apiUrl = window.CONTACT_WORKING_HOURS_API;

  applyDefaultWorkingHours();

  if (!apiUrl) {
    return;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const apiWorkingHours = payload?.workingHours ?? payload?.contact?.workingHours;

    if (typeof apiWorkingHours !== "string" || !apiWorkingHours.trim()) {
      return;
    }

    workingHoursElement.textContent = apiWorkingHours.trim();
  } catch (error) {
    // Keep default working hours when API is unavailable.
  }
}

loadWorkingHours();
