document.addEventListener("DOMContentLoaded", async () => {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event == "PASSWORD_RECOVERY") {
            const newPassword = prompt("Введіть новий пароль для вашого акаунту:");

            if (newPassword) {
                const { data, error } = await window.supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    alert("Помилка оновлення пароля: " + error.message);
                } else {
                    alert("Пароль успішно змінено!");
                }
            }
        }
    });

    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.replace("index.html");
        return;
    }

    document.getElementById("loadingOverlay").style.display = "none";
    console.log("Увійшов адміністратор:", session.user.email);

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await window.supabaseClient.auth.signOut();
        window.location.replace("index.html");
    });

    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("is-active"));
            tabPanes.forEach(p => p.classList.remove("is-active"));

            btn.classList.add("is-active");
            const targetId = btn.getAttribute("data-target");
            document.getElementById(targetId).classList.add("is-active");
        });
    });

    // loadAdminSchedule();
    // loadAdminServices();
});