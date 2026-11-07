
const API_URL = "https://jesus-store.onrender.com";

let selectedProduct = null;
let adminUser = null;
let allOrders = [];
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function order(product, price) {
    selectedProduct = { product, price };

    const form = document.getElementById("orderForm");
    const selected = document.getElementById("selectedProduct");

    if (selected) selected.textContent = `${product} - ${price} TL`;

    if (form) {
        form.style.display = "block";
        form.scrollIntoView({ behavior: "smooth" });
    }
}

async function siparisGonder() {
    if (!selectedProduct) return alert("Önce bir ürün seçmelisin.");

    const customer = document.getElementById("customerName")?.value.trim();
    const discord = document.getElementById("discordInfo")?.value.trim();
    const message = document.getElementById("orderMessage");

    if (!customer || !discord) {
        if (message) message.textContent = "Adını ve Discord bilgini gir.";
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

        if (message) message.textContent =
            `Siparişin alındı! Takip kodun: ${data.trackingCode}`;

        const trackingInput = document.getElementById("trackingCode");
        if (trackingInput) trackingInput.value = data.trackingCode;

        alert("Sipariş oluşturuldu!\nTakip kodun: " + data.trackingCode);
        selectedProduct = null;

    } catch (error) {
        console.error(error);
        if (message) message.textContent = error.message;
    }
}

function siparisFormKapat() {
    const form = document.getElementById("orderForm");
    if (form) form.style.display = "none";
    selectedProduct = null;
}

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
        const response = await fetch(`${API_URL}/track/${encodeURIComponent(code)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            result.textContent = data.message || "Sipariş bulunamadı.";
            return;
        }

        result.textContent =
            `Ürün: ${data.order.product} | Fiyat: ${data.order.price} TL | Durum: ${data.order.status}`;

    } catch {
        result.textContent = "Sunucuya bağlanılamadı.";
    }
}

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
        alert(error.message);
    }
}

function openApplication() {
    const form = document.getElementById("applicationForm");
    if (form) form.hidden = !form.hidden;
}

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
        if (message) message.textContent = error.message;
    }
}

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
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <div class="admin-container">

                <div class="admin-header">
                    <div>
                        <span class="admin-eyebrow">JESUS STORE</span>
                        <h2>Yönetim Paneli</h2>
                        <p>Hoş geldin, ${escapeHTML(adminUser.username)}</p>
                    </div>

                    <div>
                        <span class="admin-role">
                            ${adminUser.role === "owner" ? "MAĞAZA SAHİBİ" : "EKİP ÜYESİ"}
                        </span>
                        <button class="admin-logout" onclick="adminCikis()">ÇIKIŞ</button>
                    </div>
                </div>

                <div class="admin-stats">
                    <div class="admin-stat">
                        <span>TOPLAM SİPARİŞ</span>
                        <strong id="statTotal">0</strong>
                    </div>
                    <div class="admin-stat">
                        <span>BEKLEYEN</span>
                        <strong id="statPending">0</strong>
                    </div>
                    <div class="admin-stat">
                        <span>İŞLEMDE</span>
                        <strong id="statProcessing">0</strong>
                    </div>
                    <div class="admin-stat">
                        <span>TAMAMLANAN</span>
                        <strong id="statCompleted">0</strong>
                    </div>
                </div>

                <div class="admin-section">
                    <div class="admin-section-heading">
                        <div>
                            <span class="admin-eyebrow">ORDERS</span>
                            <h3>Siparişler</h3>
                        </div>
                        <button class="admin-refresh" onclick="siparisleriYukle()">YENİLE ↻</button>
                    </div>

                    <div class="admin-table-wrap">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Sipariş</th>
                                    <th>Müşteri</th>
                                    <th>Ürün</th>
                                    <th>Fiyat</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody id="adminOrders">
                                <tr><td colspan="6">Siparişler yükleniyor...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                ${adminUser.role === "owner" ? `
                    <div class="admin-section" id="staffSection">
                        <div class="admin-section-heading">
                            <div>
                                <span class="admin-eyebrow">TEAM</span>
                                <h3>Ekip Yönetimi</h3>
                            </div>
                        </div>
                        <div id="staffArea">Ekip yükleniyor...</div>
                    </div>
                ` : ""}

            </div>
        `;

        panel.scrollIntoView({ behavior: "smooth" });

        await siparisleriYukle();

        if (adminUser.role === "owner") {
            await ekipPaneliniYukle();
        }

    } catch (error) {
        console.error(error);
        alert("Admin paneli açılırken hata oluştu: " + error.message);
    }
}

async function siparisleriYukle() {
    const area = document.getElementById("adminOrders");
    if (!area) return;

    area.innerHTML = `<tr><td colspan="6">Siparişler yükleniyor...</td></tr>`;

    try {
        const data = await adminFetch("/admin/orders");
        const orders = data.orders || [];

        document.getElementById("statTotal").textContent = orders.length;
        document.getElementById("statPending").textContent =
            orders.filter(o => o.status === "Beklemede").length;
        document.getElementById("statProcessing").textContent =
            orders.filter(o => o.status === "İşlemde").length;
        document.getElementById("statCompleted").textContent =
            orders.filter(o => o.status === "Tamamlandı").length;

        if (!orders.length) {
            area.innerHTML = `<tr><td colspan="6">Henüz sipariş bulunmuyor.</td></tr>`;
            return;
        }

        area.innerHTML = orders.map(item => {
            const id = Number(item.id);
            const statusClass = item.status === "Tamamlandı"
                ? "completed"
                : item.status === "İşlemde" ? "processing" : "pending";

            return `
                <tr>
                    <td>
                        <strong>#${id}</strong>
                        <small>${escapeHTML(item.tracking_code)}</small>
                    </td>
                    <td>
                        <strong>${escapeHTML(item.customer)}</strong>
                        <small>${escapeHTML(item.discord)}</small>
                    </td>
                    <td>${escapeHTML(item.product)}</td>
                    <td>${escapeHTML(item.price)} TL</td>
                    <td>
                        <span class="admin-status ${statusClass}">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <select id="status-${id}">
                                <option value="Beklemede" ${item.status === "Beklemede" ? "selected" : ""}>Beklemede</option>
                                <option value="İşlemde" ${item.status === "İşlemde" ? "selected" : ""}>İşlemde</option>
                                <option value="Tamamlandı" ${item.status === "Tamamlandı" ? "selected" : ""}>Tamamlandı</option>
                            </select>
                            <button onclick="siparisDurumuDegistir(${id})">Kaydet</button>
                            <button class="admin-history-button" onclick="siparisLoglariniGoster(${id})">Geçmiş</button>
                            ${adminUser.role === "owner" ? `
                                <button class="admin-delete-button" onclick="siparisSil(${id})">Sil</button>
                            ` : ""}
                        </div>
                    </td>
                </tr>
                <tr class="admin-log-row">
                    <td colspan="6">
                        <div class="admin-logs" id="logs-${id}" hidden></div>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        area.innerHTML = `<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;
    }
}

async function siparisDurumuDegistir(id) {
    const status = document.getElementById(`status-${id}`)?.value;
    if (!status) return;

    try {
        await adminFetch(`/admin/orders/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });

        await siparisleriYukle();
        alert("Sipariş durumu güncellendi.");

    } catch (error) {
        alert(error.message);
    }
}

async function siparisSil(id) {
    if (adminUser?.role !== "owner") {
        alert("Bu işlem yalnızca mağaza sahiplerine açık.");
        return;
    }

    if (!confirm("Bu siparişi silmek istediğine emin misin?")) return;

    try {
        await adminFetch(`/admin/orders/${id}`, { method: "DELETE" });
        await siparisleriYukle();
        alert("Sipariş silindi.");

    } catch (error) {
        alert(error.message);
    }
}

async function siparisLoglariniGoster(id) {
    const area = document.getElementById(`logs-${id}`);
    if (!area) return;

    if (!area.hidden && area.dataset.loaded === "true") {
        area.hidden = true;
        return;
    }

    area.hidden = false;
    area.textContent = "Geçmiş yükleniyor...";

    try {
        const data = await adminFetch(`/admin/orders/${id}/logs`);
        const logs = data.logs || [];

        if (!logs.length) {
            area.textContent = "İşlem geçmişi bulunmuyor.";
            area.dataset.loaded = "true";
            return;
        }

        area.innerHTML = logs.map(log => `
            <div class="admin-log-item">
                <strong>${escapeHTML(log.username)}</strong>
                ${escapeHTML(log.old_status)} → ${escapeHTML(log.new_status)}
                <small>${log.changed_at ? new Date(log.changed_at).toLocaleString("tr-TR") : ""}</small>
            </div>
        `).join("");

        area.dataset.loaded = "true";

    } catch (error) {
        area.textContent = error.message;
    }
}

async function ekipPaneliniYukle() {
    const area = document.getElementById("staffArea");
    if (!area || adminUser?.role !== "owner") return;

    try {
        const data = await adminFetch("/admin/staff");
        const staff = data.staff || [];

        area.innerHTML = `
            <div class="staff-create-box">
                <h4>Yeni Ekip Hesabı</h4>
                <p>İstediğin kadar ekip hesabı ekleyebilirsin.</p>

                <div class="staff-create-inputs">
                    <input id="newStaffUsername" placeholder="Kullanıcı adı">
                    <input id="newStaffPassword" type="password" placeholder="Şifre (en az 8 karakter)">
                    <button onclick="ekipUyesiEkle()">HESAP OLUŞTUR</button>
                </div>
            </div>

            <div class="staff-list">
                <h4>Mevcut Ekip Üyeleri (${staff.length})</h4>
                ${staff.length ? staff.map(person => `
                    <div class="staff-item">
                        <div>
                            <strong>${escapeHTML(person.username)}</strong>
                            <small>Ekip hesabı</small>
                        </div>
                        <button onclick="ekipUyesiSil(${Number(person.id)})">HESABI SİL</button>
                    </div>
                `).join("") : `
                    <div class="admin-empty">Henüz ekip hesabı bulunmuyor.</div>
                `}
            </div>
        `;

    } catch (error) {
        area.textContent = error.message;
    }
}

async function ekipUyesiEkle() {
    const username = document.getElementById("newStaffUsername")?.value.trim();
    const password = document.getElementById("newStaffPassword")?.value;

    if (!username || !password) return alert("Kullanıcı adı ve şifre gir.");
    if (password.length < 8) return alert("Şifre en az 8 karakter olmalı.");

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
    if (adminUser?.role !== "owner") return;
    if (!confirm("Bu ekip hesabını silmek istiyor musun?")) return;

    try {
        await adminFetch(`/admin/staff/${id}`, { method: "DELETE" });
        alert("Ekip hesabı silindi.");
        await ekipPaneliniYukle();

    } catch (error) {
        alert(error.message);
    }
}

function adminCikis() {
    sessionStorage.removeItem("jesusAdminToken");
    adminUser = null;

    const panel = document.getElementById("jesusAdminPanel");
    if (panel) panel.remove();

    const message = document.getElementById("adminMessage");
    if (message) message.textContent = "";

    alert("Admin oturumu kapatıldı.");
}

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("jesusAdminToken")) {
        adminPaneliAc();
    }
});
