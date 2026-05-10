document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ ---
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
        window.location.replace("index.html");
        return;
    }

    const currentAdminId = session.user.id;
    document.getElementById("loadingOverlay").style.display = "none";

    window.supabaseClient.auth.onAuthStateChange(async (event, currentSession) => {
        if (event == "PASSWORD_RECOVERY") {
            const newPassword = prompt("Введіть новий пароль для вашого акаунту:");
            if (newPassword) {
                const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
                if (error) alert("Помилка: " + error.message);
                else alert("Пароль успішно змінено!");
            }
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await window.supabaseClient.auth.signOut();
        window.location.replace("index.html");
    });

    // --- 2. ПЕРЕМИКАННЯ ВКЛАДОК ---
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("is-active"));
            tabPanes.forEach(p => p.classList.remove("is-active"));
            btn.classList.add("is-active");
            document.getElementById(btn.getAttribute("data-target")).classList.add("is-active");
        });
    });

    // --- 3. ГРАФІК РОБОТИ ---
    const scheduleList = document.getElementById("scheduleList");
    const scheduleStatus = document.getElementById("scheduleStatus");

    async function loadSchedule() {
        const { data, error } = await window.supabaseClient.from('work_schedule').select('*').order('id', { ascending: true });

        if (error) {
            scheduleList.innerHTML = `<p style="color:red">Помилка: ${error.message}</p>`;
            return;
        }

        if (data.length === 0) {
            scheduleList.innerHTML = `<p style="color:red">Графік порожній. Виконайте SQL-запит.</p>`;
            return;
        }

        scheduleList.innerHTML = "";
        data.forEach(day => {
            const row = document.createElement("div");
            row.className = "service-row";
            const displayHours = day.is_day_off ? "" : (day.working_hours || "");

            row.innerHTML = `
                <span style="width: 100px;">${day.day_of_week}</span>
                <input type="text" class="auth-input schedule-input" data-id="${day.id}" value="${displayHours}" placeholder="10:00-19:00" style="flex: 1;">
                <label style="display: flex; align-items: center; gap: 5px; font-size: 0.9rem;">
                    <input type="checkbox" class="schedule-dayoff-checkbox" data-id="${day.id}" ${day.is_day_off ? 'checked' : ''}>
                    Вихідний
                </label>
            `;
            scheduleList.appendChild(row);
        });

        document.querySelectorAll('.schedule-dayoff-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const hoursInput = document.querySelector(`.schedule-input[data-id="${id}"]`);
                if (e.target.checked) {
                    hoursInput.value = "";
                    hoursInput.disabled = true;
                } else {
                    hoursInput.disabled = false;
                }
            });
            checkbox.dispatchEvent(new Event('change'));
        });
    }

    document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        scheduleStatus.className = "status-msg success";
        scheduleStatus.textContent = "Збереження...";

        const rows = document.querySelectorAll("#scheduleList .service-row");
        let hasError = false;

        for (const row of rows) {
            const id = row.querySelector('.schedule-input').getAttribute("data-id");
            const hours = row.querySelector('.schedule-input').value;
            const isDayOff = row.querySelector('.schedule-dayoff-checkbox').checked;

            const { error } = await window.supabaseClient.from('work_schedule').update({
                working_hours: hours,
                is_day_off: isDayOff,
                admin_id: currentAdminId
            }).eq('id', id);

            if (error) hasError = true;
        }

        if (hasError) {
            scheduleStatus.textContent = "Помилка при збереженні.";
            scheduleStatus.className = "status-msg error";
        } else {
            scheduleStatus.textContent = "Графік успішно оновлено!";
        }
    });

    // --- 4. ПОСЛУГИ ТА ЦІНИ З ФОТО І ОПИСОМ ---
    const servicesList = document.getElementById("servicesList");
    const servicesStatus = document.getElementById("servicesStatus");

    async function loadServices() {
        const { data, error } = await window.supabaseClient.from('services').select('*').order('name');

        if (error) {
            servicesList.innerHTML = `<p style="color:red">Помилка: ${error.message}</p>`;
            return;
        }

        servicesList.innerHTML = "";

        if (data.length === 0) {
            servicesList.innerHTML = `<p style="color: var(--muted)">Послуг ще немає. Натисніть "+ Додати послугу".</p>`;
        } else {
            data.forEach(service => renderServiceCard(service.id, service.name, service.price, service.description, service.image_url));
        }
    }

    function renderServiceCard(id, name, price, description, imageUrl) {
        if (servicesList.querySelector('p')) servicesList.innerHTML = "";

        const card = document.createElement("div");
        card.className = "service-card";
        card.setAttribute("data-id", id);

        const imgDisplay = imageUrl ? imageUrl : 'assets/images/placeholder.svg'; // Заглушка, якщо немає фото

        card.innerHTML = `
            <div class="service-card-header">
                <span style="font-weight: 600; font-size: 0.95rem;">${id === 'new' ? 'Нова послуга' : 'Редагування послуги'}</span>
                <button type="button" class="btn-text delete-service-btn" style="color: #d9534f;">Видалити</button>
            </div>
            
            <div class="service-card-row">
                <input type="text" class="auth-input service-name-input" value="${name}" placeholder="Назва послуги (напр. Пакет: Базовий)" required style="flex: 2;">
                <input type="number" class="auth-input service-price-input" value="${price}" placeholder="Ціна (грн)" required style="flex: 1;">
            </div>
            
            <textarea class="auth-input service-desc-input" placeholder="Детальний опис послуги..." required rows="2" style="resize: vertical; font-family: inherit;">${description || ''}</textarea>
            
            <div class="service-img-wrapper">
                <img src="${imgDisplay}" alt="Preview" class="preview-img" style="display: ${imageUrl ? 'block' : 'none'}">
                <div>
                    <label style="display:block; font-size: 0.8rem; margin-bottom: 0.3rem;">Зображення (для портфоліо):</label>
                    <input type="file" accept="image/*" class="service-img-input" data-current-url="${imageUrl || ''}">
                </div>
            </div>
        `;

        // Логіка для попереднього перегляду фото перед завантаженням
        const fileInput = card.querySelector('.service-img-input');
        const previewImg = card.querySelector('.preview-img');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                previewImg.src = URL.createObjectURL(file);
                previewImg.style.display = 'block';
            }
        });

        servicesList.appendChild(card);
    }

    // Додавання нової карточки
    document.getElementById("addServiceBtn").addEventListener("click", () => {
        renderServiceCard("new", "", "", "", "");
    });

    // Видалення послуги
    servicesList.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-service-btn")) {
            const card = e.target.closest(".service-card");
            const id = card.getAttribute("data-id");

            if (id !== "new") {
                const confirmDelete = confirm("Ви впевнені, що хочете видалити цю послугу?");
                if (!confirmDelete) return;
                await window.supabaseClient.from('services').delete().eq('id', id);
            }
            card.remove();

            if (servicesList.children.length === 0) {
                servicesList.innerHTML = `<p style="color: var(--muted)">Послуг ще немає. Натисніть "+ Додати послугу".</p>`;
            }
        }
    });

    // Збереження всіх послуг (включаючи завантаження фото в Storage)
    document.getElementById("servicesForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        servicesStatus.className = "status-msg success";
        servicesStatus.textContent = "Завантаження файлів та збереження...";

        const cards = document.querySelectorAll("#servicesList .service-card");
        let hasError = false;

        for (const card of cards) {
            const id = card.getAttribute("data-id");
            const name = card.querySelector('.service-name-input').value;
            const price = card.querySelector('.service-price-input').value;
            const description = card.querySelector('.service-desc-input').value;
            const fileInput = card.querySelector('.service-img-input');

            let finalImageUrl = fileInput.getAttribute('data-current-url'); // Беремо старий URL

            // Якщо вибрано новий файл
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                // Генеруємо унікальне ім'я, щоб уникнути конфліктів
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

                // Завантажуємо в бакет 'images'
                const { error: uploadError } = await window.supabaseClient.storage
                    .from('images')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error("Помилка завантаження фото:", uploadError.message);
                    hasError = true;
                    continue; // Пропускаємо збереження цього рядка, якщо фото не завантажилось
                }

                // Отримуємо публічний URL
                const { data: { publicUrl } } = window.supabaseClient.storage
                    .from('images')
                    .getPublicUrl(fileName);

                finalImageUrl = publicUrl;
            }

            const serviceData = {
                name: name,
                price: price,
                description: description,
                image_url: finalImageUrl,
                admin_id: currentAdminId
            };

            if (id === "new") {
                const { error } = await window.supabaseClient.from('services').insert(serviceData);
                if (error) {
                    console.error("Помилка INSERT:", error.message);
                    hasError = true;
                }
            } else {
                const { error } = await window.supabaseClient.from('services').update(serviceData).eq('id', id);
                if (error) {
                    console.error("Помилка UPDATE:", error.message);
                    hasError = true;
                }
            }
        }

        if (hasError) {
            servicesStatus.textContent = "Деякі дані не вдалося зберегти (перевірте консоль).";
            servicesStatus.className = "status-msg error";
        } else {
            servicesStatus.textContent = "Зміни успішно збережено!";
            loadServices();
        }
    });

    // --- 5. ДОДАВАННЯ АДМІНІСТРАТОРА ---
    // ... [залишено без змін з попереднього варіанту]
    const adminStatus = document.getElementById("adminStatus");

    document.getElementById("addAdminForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        adminStatus.className = "status-msg";

        const email = document.getElementById("newAdminEmail").value;
        const password = document.getElementById("newAdminPassword").value;

        const { data, error } = await window.supabaseClient.auth.signUp({ email, password });

        if (error) {
            adminStatus.textContent = "Помилка Auth: " + error.message;
            adminStatus.classList.add("error");
            return;
        }

        if (data.user) {
            await window.supabaseClient.from('admins').insert([{ id: data.user.id, email: email }]);
        }

        adminStatus.textContent = "Адміністратора створено! Поточну сесію завершено.";
        adminStatus.classList.add("success");
        document.getElementById("addAdminForm").reset();
    });

    loadSchedule();
    loadServices();
});