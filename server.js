const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("JESUS STORE SERVER ACTIVE");
});

app.post("/order", (req, res) => {
    const { product, price, customer } = req.body;

    if (!product || !price || !customer) {
        return res.status(400).json({
            success: false,
            message: "Eksik sipariş bilgisi."
        });
    }

    console.log("YENİ SİPARİŞ:", {
        product,
        price,
        customer
    });

    res.json({
        success: true,
        message: "Sipariş alındı."
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`JESUS STORE aktif: ${PORT}`);
});
