
const SERVER_URL = "https://jesus-store.onrender.com";

// MODAL OLUŞTURMA
function createModal(title, content) {
    const oldModal = document.getElementById("storeModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "storeModal";

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.88);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="
            background: #130d20;
            border: 1px solid #9333ea;
            border-radius: 18px;
            padding: 28px;
            width: 100%;
            max-width: 440px;
            color: white;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 30px #9333ea55;
            max-height: 90vh;
            overflow-y: auto;
        ">
            <h2 style="
                color: #c084fc;
                text-align: center;
                margin-bottom: 22px;
            ">${title}</h2>

            ${content}

            <button id="closeModal" type="button" style="
                width: 100%;
                margin-top: 12px;
                padding: 12px;
                background: #292035;
                color: white;
                border: 1px solid #9333ea;
                border-radius: 8px;
                cursor: pointer;
            ">KAPAT</button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeModal").onclick = () => {
        modal.remove();
    };

    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.remove();
    });

    return modal;
}

// FORM ALANI OLUŞTURMA
function field(label, name, type = "text", placeholder = "") {
    return `
        <label style="
            display: block;
            margin-top: 13px;
            font-size: 13px;
            color: #e9d5ff;
        ">${label}</label>

        <input
            name="${name}"
            type="${type}"
            placeholder="${placeholder}"
            required
            style="
                box-sizing: border-box;
                width: 100%;
                padding: 12px;
                margin-top: 6px;
                background: #21172e;
                color: white;
                border: 1px solid #9333ea;
                border-radius: 8px;
                outline: none;
            "
        >
    `;
}

// MESAJ GÖSTERME
function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "#4ade80" : "#f87171";
}

// SİPARİŞ FORMU
function order(product, price) {
    const modal = createModal("SİPARİŞ OLUŞTUR", `
        <p style="text-align:center;color:#d8b4fe;margin-bottom:18px;">
            ${product} — ${price} TL
        </p>

        <form id="orderForm">
            ${field("Ad Soyad", "customer", "text", "Adınızı girin")}
            ${field("Discord Kullanıcı Adı / ID", "discord", "text", "Kullanıcı adı veya ID")}

            <button type="submit" style="
                width: 100%;
                margin-top: 20px;
                padding: 13px;
                background: linear-gradient(90deg,#7e22ce,#a855f7);
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
            ">SİPARİŞ GÖNDER</button>
        </form>

        <p id="orderMessage" style="text-align:center;margin-top:14px;"></p>
    `);

    const form = modal.querySelector("#orderForm");

    form.onsubmit = async (event) => {
        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const message = modal.querySelector("#orderMessage");

        const data = new FormData(form);

        const customer = data.get("customer").trim();
        const discord = data.get("discord").trim();

        if (!customer || !discord) {
            showMessage(message, "Lütfen bütün alanları doldurun.");
            return;
        }

        button.disabled = true;
        button.textContent = "GÖNDERİLİYOR...";

        try {
            const response = await fetch(`${SERVER_URL}/order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    product,
                    price,
                    customer,
                    discord
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Sipariş gönderilemedi.");
            }

            showMessage(message, "Sipariş talebin başarıyla gönderildi!", true);
            form.reset();

            button.textContent = "GÖNDERİLDİ";

        } catch (error) {
            showMessage(message, error.message || "Bir hata oluştu.");
            button.disabled = false;
            button.textContent = "SİPARİŞ GÖNDER";
        }
    };
}

// ADMİN BAŞVURU FORMU
function openApplication() {
    const modal = createModal("ADMİN BAŞVURUSU", `
        <form id="applicationForm">
            ${field("Ad Soyad", "name", "text", "Adınız ve soyadınız")}
            ${field("Discord Kullanıcı Adı / ID", "discord", "text", "Kullanıcı adı veya ID")}
            ${field("Yaş", "age", "number", "Yaşınız")}

            <label style="
                display:block;
                margin-top:13px;
                font-size:13px;
                color:#e9d5ff;
            ">Neden ekibimize katılmak istiyorsun?</label>

            <textarea
                name="reason"
                required
                placeholder="Başvuru sebebinizi yazın..."
                style="
                    box-sizing:border-box;
                    width:100%;
                    min-height:90px;
                    padding:12px;
                    margin-top:6px;
                    background:#21172e;
                    color:white;
                    border:1px solid #9333ea;
                    border-radius:8px;
                    resize:vertical;
                "
            ></textarea>

            <label style="
                display:block;
                margin-top:13px;
                font-size:13px;
                color:#e9d5ff;
            ">Önceki deneyimlerin</label>

            <textarea
                name="experience"
                placeholder="Varsa önceki ekip deneyimlerin..."
                style="
                    box-sizing:border-box;
                    width:100%;
                    min-height:75px;
                    padding:12px;
                    margin-top:6px;
                    background:#21172e;
                    color:white;
                    border:1px solid #9333ea;
                    border-radius:8px;
                    resize:vertical;
                "
            ></textarea>

            <button type="submit" style="
                width:100%;
                margin-top:20px;
                padding:13px;
                background:linear-gradient(90deg,#7e22ce,#a855f7);
                color:white;
                border:none;
                border-radius:8px;
                font-weight:bold;
                cursor:pointer;
            ">BAŞVURU GÖNDER</button>
        </form>

        <p id="applicationMessage" style="text-align:center;margin-top:14px;"></p>
    `);

    const form = modal.querySelector("#applicationForm");

    form.onsubmit = async (event) => {
        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const message = modal.querySelector("#applicationMessage");
        const data = new FormData(form);

        const name = data.get("name").trim();
        const discord = data.get("discord").trim();
        const age = data.get("age").trim();
        const reason = data.get("reason").trim();
        const experience = data.get("experience").trim();

        if (!name || !discord || !age || !reason) {
            showMessage(message, "Lütfen zorunlu alanları doldurun.");
            return;
        }

        if (Number(age) < 1 || Number(age) > 99) {
            showMessage(message, "Geçerli bir yaş girin.");
            return;
        }

        button.disabled = true;
        button.textContent = "GÖNDERİLİYOR...";

        try {
            const response = await fetch(`${SERVER_URL}/application`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    discord,
                    age,
                    reason,
                    experience
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Başvuru gönderilemedi.");
            }

            showMessage(message, "Başvurun başarıyla gönderildi!", true);
            form.reset();

            button.textContent = "GÖNDERİLDİ";

        } catch (error) {
            showMessage(message, error.message || "Bir hata oluştu.");
            button.disabled = false;
            button.textContent = "BAŞVURU GÖNDER";
        }
    };
}
