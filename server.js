
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();

// YENİ JESUS STORE ADRESİ
app.use(cors({
    origin: [
        "https://jesus-store.github.io",
        "https://efeorgen1524-eng.github.io"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false
});

pool.on("error", (err) => {
    console.error("Veritabanı hatası:", err);
});

const PRODUCTS = {
    "Tweak": 400,
    "Macro-Strafe": 300,
    "Config": 150,
    "Social Pack": 100,
    "Regedit": 100
};

const STATUSES = ["Beklemede", "İşlemde", "Tamamlandı"];

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    try {
        const [salt, originalHash] = stored.split(":");
        const calculated = crypto.scryptSync(password, salt, 64);
        const original = Buffer.from(originalHash, "hex");

        return original.length === calculated.length &&
            crypto.timingSafeEqual(original, calculated);
    } catch {
        return false;
    }
}

function createToken(payload) {
    const data = Buffer.from(JSON.stringify({
        ...payload,
        expires: Date.now() + 24 * 60 * 60 * 1000
    })).toString("base64url");

    const signature = crypto
        .createHmac("sha256", process.env.JWT_SECRET)
        .update(data)
        .digest("base64url");

    return `${data}.${signature}`;
}

function auth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token || !process.env.JWT_SECRET) {
            return res.status(401).json({
                success: false,
                message: "Giriş gerekli."
            });
        }

        const [data, signature] = token.split(".");

        if (!data || !signature) {
            return res.status(401).json({
                success: false,
                message: "Geçersiz oturum."
            });
        }

        const expected = crypto
            .createHmac("sha256", process.env.JWT_SECRET)
            .update(data)
            .digest();

        const received = Buffer.from(signature, "base64url");

        if (
            received.length !== expected.length ||
            !crypto.timingSafeEqual(received, expected)
        ) {
            return res.status(401).json({
                success: false,
                message: "Geçersiz oturum."
            });
        }

        const user = JSON.parse(
            Buffer.from(data, "base64url").toString()
        );

        if (!user.expires || user.expires < Date.now()) {
            return res.status(401).json({
                success: false,
                message: "Oturum süresi dolmuş."
            });
        }

        req.user = user;
        next();

    } catch {
        return res.status(401).json({
            success: false,
            message: "Geçersiz oturum."
        });
    }
}

function ownerOnly(req, res, next) {
    if (req.user.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Bu işlem sadece mağaza sahiplerine açık."
        });
    }

    next();
}

// VERİTABANI
async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            tracking_code TEXT UNIQUE NOT NULL,
            product TEXT NOT NULL,
            price INTEGER NOT NULL,
            customer TEXT NOT NULL,
            discord TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Beklemede',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS staff (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS owners (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS order_logs (
            id SERIAL PRIMARY KEY,
            order_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            old_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            changed_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // KYZER HESABI
    const kyzerPassword = process.env.KYZER_PASSWORD;

    if (kyzerPassword) {
        await pool.query(
            `INSERT INTO owners (username, password_hash)
             VALUES ('kyzer', $1)
             ON CONFLICT (username)
             DO UPDATE SET password_hash = EXCLUDED.password_hash`,
            [hashPassword(kyzerPassword)]
        );
    }

    // QUANTE HESABI
    const quantePassword = process.env.QUANTE_PASSWORD;

    if (quantePassword) {
        await pool.query(
            `INSERT INTO owners (username, password_hash)
             VALUES ('quante', $1)
             ON CONFLICT (username)
             DO UPDATE SET password_hash = EXCLUDED.password_hash`,
            [hashPassword(quantePassword)]
        );
    }

    console.log("Veritabanı hazır.");
    console.log("JESUS STORE sahip hesapları kontrol edildi.");
}

// ANA SAYFA
app.get("/", (req, res) => {
    res.send("JESUS STORE SERVER ACTIVE 🔥");
});

// SİPARİŞ OLUŞTURMA
app.post("/order", async (req, res) => {
    try {
        const { product, customer, discord } = req.body;
        const price = PRODUCTS[product];

        if (!price || !customer?.trim() || !discord?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Ürün veya müşteri bilgileri hatalı."
            });
        }

        const trackingCode = crypto
            .randomBytes(8)
            .toString("hex")
            .toUpperCase();

        await pool.query(
            `INSERT INTO orders
            (tracking_code, product, price, customer, discord)
            VALUES ($1, $2, $3, $4, $5)`,
            [
                trackingCode,
                product,
                price,
                customer.trim(),
                discord.trim()
            ]
        );

        const webhook = process.env.DISCORD_WEBHOOK;

        if (webhook) {
            try {
                await fetch(webhook, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        embeds: [{
                            title: "📦 YENİ SİPARİŞ",
                            color: 10181046,
                            fields: [
                                { name: "Takip Kodu", value: trackingCode },
                                { name: "Ürün", value: product },
                                { name: "Fiyat", value: price + " TL" },
                                { name: "Müşteri", value: customer },
                                { name: "Discord", value: discord }
                            ],
                            footer: { text: "JESUS STORE" }
                        }]
                    })
                });
            } catch (error) {
                console.error("Discord bildirimi gönderilemedi:", error);
            }
        }

        res.json({
            success: true,
            trackingCode,
            message: "Sipariş oluşturuldu."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Sipariş kaydedilemedi."
        });
    }
});

// SİPARİŞ TAKİBİ
app.get("/track/:code", async (req, res) => {
    try {
        const code = req.params.code.trim().toUpperCase();

        const result = await pool.query(
            `SELECT tracking_code, product, price, status, created_at
             FROM orders WHERE tracking_code = $1`,
            [code]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Sipariş bulunamadı."
            });
        }

        res.json({
            success: true,
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Takip bilgisi alınamadı."
        });
    }
});

// YÖNETİCİ GİRİŞİ
app.post("/admin/login", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı ve şifre gerekli."
            });
        }

        // SAHİP KONTROLÜ
        const ownerResult = await pool.query(
            "SELECT * FROM owners WHERE username = $1",
            [username]
        );

        const owner = ownerResult.rows[0];

        if (owner && verifyPassword(password, owner.password_hash)) {
            return res.json({
                success: true,
                token: createToken({
                    username: owner.username,
                    role: "owner"
                }),
                username: owner.username,
                role: "owner"
            });
        }

        // EKİP KONTROLÜ
        const staffResult = await pool.query(
            "SELECT * FROM staff WHERE username = $1",
            [username]
        );

        const staff = staffResult.rows[0];

        if (staff && verifyPassword(password, staff.password_hash)) {
            return res.json({
                success: true,
                token: createToken({
                    username: staff.username,
                    role: "staff"
                }),
                username: staff.username,
                role: "staff"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Kullanıcı adı veya şifre yanlış."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Giriş yapılamadı."
        });
    }
});

// OTURUM KONTROLÜ
app.get("/admin/me", auth, (req, res) => {
    res.json({
        success: true,
        username: req.user.username,
        role: req.user.role
    });
});

// TÜM SİPARİŞLER
app.get("/admin/orders", auth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM orders ORDER BY created_at DESC"
        );

        res.json({
            success: true,
            orders: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Siparişler alınamadı."
        });
    }
});

// SİPARİŞ DURUMU DEĞİŞTİRME
app.patch("/admin/orders/:id/status", auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Geçersiz durum."
            });
        }

        const old = await pool.query(
            "SELECT status FROM orders WHERE id = $1",
            [req.params.id]
        );

        if (!old.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Sipariş bulunamadı."
            });
        }

        await pool.query(
            "UPDATE orders SET status = $1 WHERE id = $2",
            [status, req.params.id]
        );

        await pool.query(
            `INSERT INTO order_logs
            (order_id, username, old_status, new_status)
            VALUES ($1, $2, $3, $4)`,
            [
                req.params.id,
                req.user.username,
                old.rows[0].status,
                status
            ]
        );

        res.json({
            success: true,
            message: "Sipariş durumu güncellendi."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Durum güncellenemedi."
        });
    }
});

// SİPARİŞ SİLME - SADECE SAHİPLER
app.delete("/admin/orders/:id", auth, ownerOnly, async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM order_logs WHERE order_id = $1",
            [req.params.id]
        );

        const result = await pool.query(
            "DELETE FROM orders WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Sipariş bulunamadı."
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Sipariş silinemedi."
        });
    }
});

// EKİP LİSTESİ - SADECE SAHİPLER
app.get("/admin/staff", auth, ownerOnly, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, created_at FROM staff ORDER BY id"
        );

        res.json({
            success: true,
            staff: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Ekip listesi alınamadı."
        });
    }
});

// EKİP HESABI OLUŞTURMA - SINIRSIZ
app.post("/admin/staff", auth, ownerOnly, async (req, res) => {
    try {
        const username = String(req.body.username || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!/^[a-z0-9_-]{3,24}$/.test(username) || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı 3-24 karakter olmalı; şifre en az 8 karakter olmalı."
            });
        }

        if (username === "kyzer" || username === "quante") {
            return res.status(400).json({
                success: false,
                message: "Bu kullanıcı adı sahip hesaplarına ayrılmış."
            });
        }

        const existing = await pool.query(
            `SELECT username FROM owners WHERE username = $1
             UNION
             SELECT username FROM staff WHERE username = $1`,
            [username]
        );

        if (existing.rows.length) {
            return res.status(400).json({
                success: false,
                message: "Bu kullanıcı adı zaten kullanılıyor."
            });
        }

        await pool.query(
            "INSERT INTO staff (username, password_hash) VALUES ($1, $2)",
            [username, hashPassword(password)]
        );

        res.json({
            success: true,
            message: "Ekip hesabı oluşturuldu."
        });

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Bu kullanıcı adı zaten kullanılıyor."
            });
        }

        res.status(500).json({
            success: false,
            message: "Ekip hesabı oluşturulamadı."
        });
    }
});

// EKİP HESABI SİLME - SADECE SAHİPLER
app.delete("/admin/staff/:id", auth, ownerOnly, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM staff WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: "Ekip hesabı bulunamadı."
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Ekip hesabı silinemedi."
        });
    }
});

// SİPARİŞ İŞLEM GEÇMİŞİ
app.get("/admin/orders/:id/logs", auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT username, old_status, new_status, changed_at
             FROM order_logs
             WHERE order_id = $1
             ORDER BY changed_at DESC`,
            [req.params.id]
        );

        res.json({
            success: true,
            logs: result.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Geçmiş alınamadı."
        });
    }
});

// ADMİN BAŞVURUSU
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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                embeds: [{
                    title: "📝 YENİ ADMİN BAŞVURUSU",
                    color: 10181046,
                    fields: [
                        { name: "Ad Soyad", value: String(name) },
                        { name: "Discord", value: String(discord) },
                        { name: "Yaş", value: String(age) },
                        { name: "Başvuru Sebebi", value: String(reason) },
                        {
                            name: "Deneyim",
                            value: String(experience || "Belirtilmedi")
                        }
                    ],
                    footer: { text: "JESUS STORE" }
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
            message: "Başvuru gönderilemedi."
        });
    }
});

// SUNUCUYU BAŞLAT
const PORT = process.env.PORT || 3000;

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log("JESUS STORE SERVER ACTIVE 🔥");
        });
    })
    .catch((error) => {
        console.error("Veritabanı başlatılamadı:", error);
        process.exit(1);
    });
