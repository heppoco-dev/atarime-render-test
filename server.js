const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// ------------------------------
// CORS（テスト用：全許可）
// ------------------------------
app.use(cors({
	origin: "*",
	methods: ["GET", "POST", "OPTIONS"],
	allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Node server is running!");
});

// ------------------------------
// 書き込みテスト：data/ に保存
// POST /write-test
// body: { message: "...", time: 123, ... }
// ------------------------------
app.post("/write-test", (req, res) => {
	try {
		const payload = req.body || {};

		// 保存フォルダ（存在しなければ作る）
		const dir = path.join(__dirname, "data");
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// ファイル名（time優先。なければ現在時刻）
		const t = (typeof payload.time === "number") ? payload.time : Date.now();
		const filename = `test_${t}.json`;
		const filePath = path.join(dir, filename);

		// JSON保存
		fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

		console.log("Saved:", filePath);

		res.json({
			ok: true,
			saved: true,
			filename: filename
		});
	} catch (e) {
		console.error("Write error:", e);
		res.status(500).json({
			ok: false,
			error: String(e)
		});
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server started on port", PORT);
});
