
const API_URL = "https://jesus-store.onrender.com";

let selectedProduct = null;
let adminUser = null;

// ÜRÜN SEÇME
function order(product, price) {
    selectedProduct = { product, price };

    const form = document.getElementById("orderForm");
    const selected = document.getElementById("selectedProduct");

    if (selected) {
        selected.value = `${product} - ${price} TL`;
    }

    if (form) {
        form.style.display = "block";
        form.scrollIntoView({ behavior: "smooth" });
    }
}

// SİPARİŞ OLUŞTURMA
async function siparisGonder() {
    if (!selectedProduct) {
        alert("Önce bir ürün seçmelisin.");
        return;
    }

    const customer = document.getElementById("customerName")?.value.trim();
    const discord = document.getElementById("discordInfo")?.value.trim();
    const message = document.getElementById("orderMessage");

    if (!customer || !discord) {
        alert("Adını ve Discord kullanıcı adı / ID bilgini gir.");
        return;
    }

    try {
        if (message) message.textContent = "Sipariş oluşturuluyor...";

        const response = await fetch(`${API_URL}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product: selectedProduct.product,
                price: selectedProduct.price,
                customer,
                discord
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Sipariş oluşturulamadı.");
        }

        if (message) {
            message.textContent = `Siparişin alındı! Takip kodun: ${data.trackingCode}`;
        }

        alert(
            "Siparişin başarıyla oluşturuldu!\n\nTakip kodun: " +
            data.trackingCode
        );

        const trackingInput = document.getElementById("trackingCode");
        if (trackingInput) trackingInput.value = data.trackingCode;

    } catch (error) {
        console.error(error);
        if (message) message.textContent = error.message;
        else alert(error.message);
    }
}

// SİPARİŞ FORMUNU KAPAT
function siparisFormKapat() {
    const form = document.getElementById("orderForm");
    if (form) form.style.display = "none";
    selectedProduct = null;
}

// SİPARİŞ TAKİBİ
async function siparisTakipEt() {
    const input = document.getElementById("trackingCode");
    const result = document.getElementById("trackingResult");

    if (!input || !result) return;

    const code = input.value.trim();

    if (!code) {
        result.textContent = "Lütfen takip kodunu gir.";
        return;
    }

    result.textContent = "Sipariş aranıyor...";

    try {
        const response = await fetch(
            `${API_URL}/track/${encodeURIComponent(code)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            result.textContent = data.message || "Sipariş bulunamadı.";
            return;
        }

        result.textContent =
            `Ürün: ${data.order.product} | ` +
            `Fiyat: ${data.order.price} TL | ` +
            `Durum: ${data.order.status}`;

    } catch (error) {
        console.error(error);
        result.textContent = "Sunucuya bağlanılamadı.";
    }
}

// ADMİN BAŞVURUSU
async function applicationSubmit() {
    const name = document.getElementById("appName")?.value.trim();
    const discord = document.getElementById("appDiscord")?.value.trim();
    const age = document.getElementById("appAge")?.value.trim();
    const reason = document.getElementById("appReason")?.value.trim();
    const experience = document.getElementById("appExperience")?.value.trim();

    if (!name || !discord || !age || !reason) {
        alert("Lütfen zorunlu alanları doldur.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/application`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, discord, age, reason, experience })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Başvuru gönderilemedi.");
        }

        alert("Başvurun başarıyla gönderildi!");

    } catch (error) {
        console.error(error);
        alert(error.message || "Sunucuya bağlanılamadı.");
    }
}

// BAŞVURU FORMUNU AÇ / KAPAT
function openApplication() {
    const form = document.getElementById("applicationForm");
    if (form) form.hidden = !form.hidden;
}

// ADMİN GİRİŞİ
async function adminLogin() {
    const username = document.getElementById("adminUsername")?.value.trim();
    const password = document.getElementById("adminPassword")?.value;
    const message = document.getElementById("adminMessage");

    if (!username || !password) {
        if (message) message.textContent = "Kullanıcı adı ve şifre gerekli.";
        return;
    }

    try {
        if (message) message.textContent = "Giriş yapılıyor...";

        const response = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.token) {
            throw new Error(data.message || "Giriş başarısız.");
        }

        sessionStorage.setItem("jesusAdminToken", data.token);

        if (message) message.textContent = "Giriş başarılı!";
        await adminPaneliAc();

    } catch (error) {
        console.error(error);
        if (message) message.textContent = error.message;
    }
}

// ADMİN PANELİNİ AÇ
async function adminPaneliAc() {
    const token = sessionStorage.getItem("jesusAdminToken");

    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/admin/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            sessionStorage.removeItem("jesusAdminToken");
            alert("Oturumun sona ermiş. Yeniden giriş yap.");
            return;
        }

        adminUser = {
    username: data.username,
    role: data.role
};

        let panel = document.getElementById("jesusAdminPanel");

        if (!panel) {
            panel = document.createElement("section");
            panel.id = "jesusAdminPanel";
            panel.style.cssText =
                "background:#171020;color:white;padding:25px;margin:30px auto;" +
                "max-width:1100px;border:1px solid #873cff;border-radius:15px;";
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <h2>JESUS STORE - YÖNETİM PANELİ</h2>
            <p>Hoş geldin, ${escapeHTML(adminUser.username || "Yönetici")}</p>
            <button onclick="siparisleriYukle()">Siparişleri Yenile</button>
            <button onclick="adminCikis()">Çıkış Yap</button>
            <div id="adminOrders" style="margin-top:20px;">Siparişler yükleniyor...</div>
            <div id="staffArea" style="margin-top:30px;"></div>
        `;

        panel.scrollIntoView({ behavior: "smooth" });
        await siparisleriYukle();

        if (adminUser.role === "owner" || adminUser.isOwner === true) {
            await ekipPaneliniYukle();
        }

    } catch (error) {
        console.error(error);
        alert("Admin paneli açılırken hata oluştu.");
    }
}

// HTML GÜVENLİ METİN
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// ADMİN İSTEKLERİ
async function adminFetch(path, options = {}) {
    const token = sessionStorage.getItem("jesusAdminToken");

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "İşlem başarısız.");
    }

    return data;
}

// SİPARİŞLERİ LİSTELE
async function siparisleriYukle() {
    const area = document.getElementById("adminOrders");
    if (!area) return;

    area.textContent = "Siparişler yükleniyor...";

    try {
        const data = await adminFetch("/admin/orders");
        const orders = data.orders || [];

        if (!orders.length) {
            area.textContent = "Henüz sipariş bulunmuyor.";
            return;
        }

        area.innerHTML = orders.map(item => `
            <div style="background:#241832;padding:15px;margin:12px 0;border-radius:10px;">
                <b>${escapeHTML(item.product)}</b> - ${escapeHTML(item.price)} TL
                <p>Müşteri: ${escapeHTML(item.customer)}</p>
                <p>Discord: ${escapeHTML(item.discord)}</p>
                <p>Takip kodu: ${escapeHTML(item.tracking_code)}</p>
                <p>Durum: ${escapeHTML(item.status)}</p>
                <select id="status-${Number(item.id)}">
                    <option ${item.status === "Beklemede" ? "selected" : ""}>Beklemede</option>
                    <option ${item.status === "İşlemde" ? "selected" : ""}>İşlemde</option>
                    <option ${item.status === "Tamamlandı" ? "selected" : ""}>Tamamlandı</option>
                </select>
                <button onclick="siparisDurumuDegistir(${Number(item.id)})">Durumu Kaydet</button>
                ${adminUser?.role === "owner" || adminUser?.isOwner === true
                    ? `<button onclick="siparisSil(${Number(item.id)})">Siparişi Sil</button>`
                    : ""}
                <button onclick="siparisLoglariniGoster(${Number(item.id)})">İşlem Geçmişi</button>
                <div id="logs-${Number(item.id)}"></div>
            </div>
        `).join("");

    } catch (error) {
        console.error(error);
        area.textContent = error.message;
    }
}

// SİPARİŞ DURUMU DEĞİŞTİR
async function siparisDurumuDegistir(id) {
    const status = document.getElementById(`status-${id}`)?.value;
    if (!status) return;

    try {
        await adminFetch(`/admin/orders/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        alert("Sipariş durumu güncellendi.");
        await siparisleriYukle();

    } catch (error) {
        alert(error.message);
    }
}

// SİPARİŞ SİL
async function siparisSil(id) {
    if (adminUser?.role !== "owner" && adminUser?.isOwner !== true) {
        alert("Bu işlem yalnızca mağaza sahibine açık.");
        return;
    }

    if (!confirm("Bu siparişi silmek istediğine emin misin?")) return;

    try {
        await adminFetch(`/admin/orders/${id}`, { method: "DELETE" });
        alert("Sipariş silindi.");
        await siparisleriYukle();

    } catch (error) {
        alert(error.message);
    }
}

// SİPARİŞ İŞLEM GEÇMİŞİ
async function siparisLoglariniGoster(id) {
    const area = document.getElementById(`logs-${id}`);
    if (!area) return;

    try {
        const data = await adminFetch(`/admin/orders/${id}/logs`);
        const logs = data.logs || [];

        area.innerHTML = logs.length
            ? logs.map(log =>
                `<p>${escapeHTML(log.username)}: ${escapeHTML(log.old_status)} → ${escapeHTML(log.new_status)}</p>`
              ).join("")
            : "<p>İşlem geçmişi bulunamadı.</p>";

    } catch (error) {
        area.textContent = error.message;
    }
}

// EKİP YÖNETİMİ
async function ekipPaneliniYukle() {
    const area = document.getElementById("staffArea");
    if (!area) return;

    try {
        const data = await adminFetch("/admin/staff");
        const staff = data.staff || [];

        area.innerHTML = `
            <h3>Ekip Yönetimi</h3>
            <p>En fazla 5 ekip hesabı oluşturabilirsin.</p>
            <input id="newStaffUsername" placeholder="Yeni ekip kullanıcı adı">
            <input id="newStaffPassword" type="password" placeholder="Yeni ekip şifresi">
            <button onclick="ekipUyesiEkle()">Ekip Üyesi Ekle</button>
            <div>
                ${staff.map(person => `
                    <p>
                        ${escapeHTML(person.username)}
                        <button onclick="ekipUyesiSil(${Number(person.id)})">Hesabı Sil</button>
                    </p>
                `).join("")}
            </div>
        `;

    } catch (error) {
        area.textContent = error.message;
    }
}

async function ekipUyesiEkle() {
    const username = document.getElementById("newStaffUsername")?.value.trim();
    const password = document.getElementById("newStaffPassword")?.value;

    if (!username || !password) {
        alert("Kullanıcı adı ve şifre gir.");
        return;
    }

    try {
        await adminFetch("/admin/staff", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        alert("Ekip hesabı oluşturuldu.");
        await ekipPaneliniYukle();

    } catch (error) {
        alert(error.message);
    }
}

async function ekipUyesiSil(id) {
    if (!confirm("Bu ekip hesabını silmek istiyor musun?")) return;

    try {
        await adminFetch(`/admin/staff/${id}`, { method: "DELETE" });
        alert("Ekip hesabı silindi.");
        await ekipPaneliniYukle();

    } catch (error) {
        alert(error.message);
    }
}

// ÇIKIŞ
function adminCikis() {
    sessionStorage.removeItem("jesusAdminToken");
    adminUser = null;

    const panel = document.getElementById("jesusAdminPanel");
    if (panel) panel.remove();

    alert("Admin oturumu kapatıldı.");
}
