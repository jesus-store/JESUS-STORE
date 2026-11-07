
const SERVER_URL = "https://jesus-store.onrender.com";

// PENCERE OLUŞTURMA
function createModal(title, content) {
    const old = document.getElementById("storeModal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "storeModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.88);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:99999;
        padding:20px;
        overflow-y:auto;
    `;

    modal.innerHTML = `
        <div style="
            background:#130d20;
            border:1px solid #9333ea;
            border-radius:18px;
            padding:30px;
            width:100%;
            max-width:420px;
            color:white;
            font-family:Arial;
            box-shadow:0 0 30px #9333ea55;
        ">
            <h2 style="color:#c084fc;text-align:center">${title}</h2>
            ${content}
            <button id="closeModal" type="button"
                style="width:100%;margin-top:12px;padding:12px;
                background:#292035;color:white;border:0;border-radius:8px;">
                KAPAT
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById("closeModal").onclick = () => modal.remove();

    return modal;
}

// FORM TASARIMI
function field(label, name, type = "text") {
    return `
        <label style="display:block;margin-top:12px">${label}</label>
        <input name="${name}" type="${type}" required
            style="box-sizing:border-box;width:100%;padding:12px;
            margin-top:5px;background:#21172e;color:white;
            border:1px solid #9333ea;border-radius:7px;">
    `;
}

// SİPARİŞ
function order(name, price) {
    const modal = createModal("SİPARİŞ OLUŞTUR", `
        <p>${name} - ${price} TL</p>
        <form id="orderForm">
            ${field("Ad Soyad", "customer")}
            ${field("Discord Kullanıcı Adı", "discord")}
            <button type="submit" style="width:100%;margin-top:20px;
                padding:13px;background:#9333ea;color:white;
                border:0;border-radius:8px;font-weight:bold;">
                SİPARİŞ GÖNDER
            </button>
        </form>
        <p id="orderMessage"></p>
    `);

    document.getElementById("orderForm").onsubmit = async (e) => {
        e.preventDefault();

        const form = new FormData(e.target);
        const message = document.getElementById("orderMessage");
        const button = e.target.querySelector("button");

        button.disabled = true;
        message.textContent = "Gönderiliyor...";

        try {
            const response = await fetch(SERVER_URL + "/order", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    product: name,
                    price,
                    customer: form.get("customer"),
                    discord: form.get("discord")
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Sipariş gönderilemedi.");
            }

            message.textContent = "Siparişin başarıyla gönderildi!";
            e.target.reset();
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    };
}

// ADMİN BAŞVURUSU
function openApplication() {
    createModal("ADMİN BAŞVURUSU", `
        <form id="applicationForm">
            ${field("Ad Soyad", "name")}
            ${field("Discord Kullanıcı Adı", "discord")}
            ${field("Yaş", "age", "number")}
            ${field("Neden ekibimize katılmak istiyorsun?", "reason")}
            ${field("Önceki yetkili deneyimin", "experience")}

            <button type="submit" style="width:100%;margin-top:20px;
                padding:13px;background:#9333ea;color:white;
                border:0;border-radius:8px;font-weight:bold;">
                BAŞVURUYU GÖNDER
            </button>
        </form>
        <p id="applicationMessage"></p>
    `);

    document.getElementById("applicationForm").onsubmit = async (e) => {
        e.preventDefault();

        const form = new FormData(e.target);
        const message = document.getElementById("applicationMessage");
        const button = e.target.querySelector("button");

        button.disabled = true;
        message.textContent = "Başvurun gönderiliyor...";

        try {
            const response = await fetch(SERVER_URL + "/application", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: form.get("name"),
                    discord: form.get("discord"),
                    age: form.get("age"),
                    reason: form.get("reason"),
                    experience: form.get("experience")
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Başvuru gönderilemedi.");
            }

            message.textContent = "Başvurun başarıyla gönderildi!";
            e.target.reset();
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    };
}
