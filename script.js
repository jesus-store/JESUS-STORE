function order(name, price) {
    const oldModal = document.getElementById("orderModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "orderModal";

    modal.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:rgba(0,0,0,0.85);
            display:flex;
            align-items:center;
            justify-content:center;
            z-index:9999;
            padding:20px;
        ">
            <div style="
                background:#130d20;
                border:1px solid #9333ea;
                border-radius:18px;
                padding:35px;
                width:100%;
                max-width:400px;
                text-align:center;
                box-shadow:0 0 35px #9333ea55;
                color:white;
            ">
                <h2 style="color:#c084fc;margin-bottom:20px;">
                    JESUS STORE
                </h2>

                <p style="color:#aaa;">Seçtiğin ürün</p>

                <h3 style="margin:12px 0;">${name}</h3>

                <h2 style="color:#c084fc;margin-bottom:25px;">
                    ${price} TL
                </h2>

                <button id="continueOrder" style="
                    width:100%;
                    padding:14px;
                    background:linear-gradient(90deg,#7e22ce,#a855f7);
                    color:white;
                    border:0;
                    border-radius:8px;
                    cursor:pointer;
                    font-weight:bold;
                ">
                    DEVAM ET
                </button>

                <button id="closeOrder" style="
                    margin-top:12px;
                    background:transparent;
                    color:#aaa;
                    border:0;
                    cursor:pointer;
                    padding:10px;
                ">
                    KAPAT
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeOrder").onclick = () => {
        modal.remove();
    };

    document.getElementById("continueOrder").onclick = () => {
        alert("Ödeme sistemi henüz bağlanmadı. Gerçek sipariş için ödeme altyapısını kurmamız gerekiyor.");
    };
}
