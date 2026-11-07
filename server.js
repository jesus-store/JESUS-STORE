
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

// SİPARİŞ SİSTEMİ
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
                message: "Sipariş webhook ayarlanmamış."
            });
        }

        const response = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{
                    title: "📦 YENİ SİPARİŞ",
                    color: 10181046,
                    fields: [
                        { name: "Ürün", value: String(product) },
                        { name: "Fiyat", value: String(price) + " TL" },
                        { name: "Müşteri", value: String(customer) },
                        { name: "Discord Kullanıcı Adı / ID", value: String(discord) }
                    ],
                    footer: { text: "JESUS STORE" }
                }]
            })
        });

        if (!response.ok) throw new Error("Discord bildirimi gönderilemedi.");

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Sipariş gönderilemedi."
        });
    }
});

// ADMİN BAŞVURU SİSTEMİ
app.post("/application", async (req, res) => {
    try {
        const { name, discord, age, reason, experience } = req.body;

        if (!name || !discord || !age || !reason) {
            return res.status(400).json({
                success: false,
                message: "Eksik bilgi!"
            });
        }

        const webhook = process.env.ADMIN_WEBHOOK;

        if (!webhook) {
            return res.status(500).json({
                success: false,
                message: "Başvuru webhook ayarlanmamış."
            });
        }

        const response = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{
                    title: "📝 YENİ ADMİN BAŞVURUSU",
                    color: 10181046,
                    fields: [
                        { name: "Ad Soyad", value: String(name) },
                        { name: "Discord Kullanıcı Adı / ID", value: String(discord) },
                        { name: "Yaş", value: String(age) },
                        { name: "Başvuru Sebebi", value: String(reason) },
                        { name: "Deneyim", value: String(experience || "Belirtilmedi") }
                    ],
                    footer: { text: "JESUS STORE" }
                }]
            })
        });

        if (!response.ok) throw new Error("Discord bildirimi gönderilemedi.");

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Başvuru gönderilemedi."
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("JESUS STORE SERVER ACTIVE");
});
