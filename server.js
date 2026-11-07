const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "https://efeorgen1524-eng.github.io"
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("JESUS STORE SERVER ACTIVE 🔥");
});

app.post("/order", async (req, res) => {
    try {
        const { product, price, customer, discord } = req.body;

        if (!product || !price || !customer || !discord) {
            return res.status(400).json({
                success: false,
                message: "Eksik bilgi!"
            });
        }

        const webhook = process.env.DISCORD_WEBHOOK;

        if (!webhook) {
            return res.status(500).json({
                success: false,
                message: "Webhook ayarlanmamış."
            });
        }

        const response = await fetch(webhook, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                embeds: [{
                    title: "📦 YENİ SİPARİŞ",
                    color: 10181046,
                    fields: [
                        { name: "Ürün", value: product },
                        { name: "Fiyat", value: price + " TL" },
                        { name: "Müşteri", value: customer },
                        { name: "Discord", value: discord }
                    ],
                    footer: {
                        text: "JESUS STORE"
                    }
                }]
            })
        });

        if (!response.ok) {
            throw new Error("Discord bildirimi gönderilemedi.");
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Sipariş gönderilemedi."
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("JESUS STORE SERVER ACTIVE");
});
