const express = require("express");
const cors = require("cors");

const app = express();

// ------------------------------------------------------------
// CORS（まずはテスト用に全許可）
// 本番では origin を絞る想定
// ------------------------------------------------------------
app.use(cors({
	origin: "*",
	methods: ["GET", "POST", "OPTIONS"],
	allowedHeaders: ["Content-Type"]
}));

// preflight を明示的に返す（環境によって必要になる）
app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Node server is running!");
});

app.post("/write-test", (req, res) => {
	console.log("Received:", req.body);
	res.json({ ok: true, received: req.body });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log("Server started on port", PORT);
});
