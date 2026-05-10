// --- 1. АНІМАЦІЇ ТА ІНТЕРФЕЙС (залишено без змін) ---
const revealElements = document.querySelectorAll(".reveal");
const scrollButtons = document.querySelectorAll("[data-scroll]");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

revealElements.forEach((element) => revealObserver.observe(element));

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSelector = button.getAttribute("data-scroll");
    const target = document.querySelector(targetSelector);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const hero = document.querySelector(".hero");
const decorElements = document.querySelectorAll(".decor");

window.addEventListener("mousemove", (event) => {
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { innerWidth, innerHeight } = window;
  const xRatio = (event.clientX / innerWidth - 0.5) * 2;
  const yRatio = (event.clientY / innerHeight - 0.5) * 2;
  decorElements.forEach((decor, index) => {
    const speed = (index + 1) * 2.4;
    decor.style.transform = `translate(${xRatio * speed}px, ${yRatio * speed}px)`;
  });
});

// --- 2. ЗАВАНТАЖЕННЯ ДАНИХ З БАЗИ ДАНИХ (SUPABASE) ---

// Форматування ціни
function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

// Завантаження графіка роботи
async function loadWorkingHours() {
  const displayElement = document.getElementById("display-working-hours");
  if (!displayElement) return;

  try {
    const { data: schedule, error } = await window.supabaseClient
      .from('work_schedule')
      .select('day_of_week, working_hours, is_day_off')
      .order('id', { ascending: true });

    if (error) throw error;

    if (schedule && schedule.length > 0) {
      const text = schedule.map(day => {
        return `${day.day_of_week}: ${day.is_day_off ? 'Вихідний' : day.working_hours}`;
      }).join(', ');
      displayElement.textContent = text;
    }
  } catch (err) {
    console.error("Помилка графіка:", err);
  }
}

// Завантаження послуг на головну сторінку
async function loadMainServices() {
  const servicesContainer = document.getElementById("services-container");
  const packagesContainer = document.getElementById("packages-container");
  if (!servicesContainer || !packagesContainer) return;

  try {
    // Отримуємо всі дані з таблиці services
    const { data: services, error } = await window.supabaseClient
      .from('services')
      .select('name, price, description, image_url'); // Додано опис та фото

    if (error) throw error;

    servicesContainer.innerHTML = "";
    packagesContainer.innerHTML = "";

    services.forEach(item => {
      // Перевірка, чи є послуга пакетом (за наявністю слова у назві)
      const isPackage = item.name.toLowerCase().includes("пакет");

      // Створення HTML для звичайної картки послуги
      if (!isPackage) {
        const cardHtml = `
          <article class="card">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="card-img" loading="lazy">` : ''}
            <div class="card-head">
              <h3>${item.name}</h3>
              <span class="service-price">${formatPrice(item.price)}</span>
            </div>
            <p>${item.description || 'Опис готується...'}</p>
          </article>
        `;
        servicesContainer.insertAdjacentHTML('beforeend', cardHtml);
      }
      // Створення HTML для пакета послуг
      else {
        const packageHtml = `
          <section class="package-item">
            <div class="package-head">
              <h4>${item.name}</h4>
              <span class="service-price">${formatPrice(item.price)}</span>
            </div>
            <p>${item.description || ''}</p>
          </section>
        `;
        packagesContainer.insertAdjacentHTML('beforeend', packageHtml);
      }
    });
  } catch (err) {
    console.error("Помилка при завантаженні послуг з БД:", err.message);
  }
}

// Завантаження портфоліо
async function loadPortfolioItems() {
  const container = document.getElementById("portfolio-container");
  if (!container) return;

  try {
    const { data: items, error } = await window.supabaseClient
      .from('services')
      .select('*');

    if (error) throw error;

    container.innerHTML = "";
    items.forEach(item => {
      // Для портфоліо не показуємо пакети
      if (item.name.toLowerCase().includes("пакет")) return;

      // Якщо немає фото в БД, ставимо картинку-заглушку
      const imgPath = item.image_url || 'assets/images/portfolio/gift-box.svg';

      const html = `
        <figure class="tile">
          <img src="${imgPath}" alt="${item.name}" loading="lazy" />
          <figcaption>
            <span class="tile-title">${item.name}</span>
            <span class="tile-price">${formatPrice(item.price)}</span>
          </figcaption>
        </figure>
      `;
      container.insertAdjacentHTML('beforeend', html);
    });
  } catch (err) {
    console.error("Помилка портфоліо:", err);
  }
}

// Виклик функцій завантаження при старті сторінки
document.addEventListener("DOMContentLoaded", () => {
  loadWorkingHours();
  loadMainServices();
  loadPortfolioItems();
});


// --- 3. ЛОГІКА АВТОРИЗАЦІЇ ТА ВИПАДАЮЧОГО МЕНЮ ---
const authToggleBtn = document.getElementById("authToggleBtn");
const authDropdown = document.getElementById("authDropdown");
const loginForm = document.getElementById("loginForm");
const resetForm = document.getElementById("resetForm");
const showResetFormBtn = document.getElementById("showResetFormBtn");
const showLoginFormBtn = document.getElementById("showLoginFormBtn");
const authError = document.getElementById("authError");
const resetMessage = document.getElementById("resetMessage");

authToggleBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  authDropdown.classList.toggle("is-open");
});

document.addEventListener("click", (e) => {
  if (authDropdown && !authDropdown.contains(e.target) && !authToggleBtn.contains(e.target)) {
    authDropdown.classList.remove("is-open");
    setTimeout(() => {
      loginForm.style.display = "flex";
      resetForm.style.display = "none";
      authError.style.display = "none";
      resetMessage.style.display = "none";
    }, 300);
  }
});

showResetFormBtn?.addEventListener("click", () => {
  loginForm.style.display = "none";
  resetForm.style.display = "flex";
  authError.style.display = "none";
});

showLoginFormBtn?.addEventListener("click", () => {
  resetForm.style.display = "none";
  loginForm.style.display = "flex";
  resetMessage.style.display = "none";
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.style.display = "none";

  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  const { error } = await window.loginAdmin(email, password);

  if (error) {
    authError.style.color = "#d9534f";
    authError.textContent = "Невірний email або пароль";
    authError.style.display = "block";
  } else {
    window.location.href = "admin.html";
  }
});

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessage.style.display = "none";

  const email = document.getElementById("resetEmail").value;
  const { error } = await window.resetAdminPassword(email);

  if (error) {
    resetMessage.style.color = "#d9534f";
    resetMessage.textContent = error.message;
  } else {
    resetMessage.style.color = "var(--accent)";
    resetMessage.textContent = "Лист надіслано на вашу пошту";
  }
  resetMessage.style.display = "block";
});