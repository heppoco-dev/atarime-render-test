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

// ------------------------------------------------------------
// 共通：フォルダ作成＆JSON保存
// ------------------------------------------------------------
function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function saveJson(filePath, obj) {
	fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

// ------------------------------------------------------------
// 既存テスト：そのまま残す（動作確認用）
// ------------------------------------------------------------
app.post("/write-test", (req, res) => {
	try {
		const payload = req.body || {};

		const dir = path.join(__dirname, "data");
		ensureDir(dir);

		const t = (typeof payload.time === "number") ? payload.time : Date.now();
		const filename = `test_${t}.json`;
		const filePath = path.join(dir, filename);

		saveJson(filePath, payload);

		console.log("Saved:", filePath);

		res.json({ ok: true, saved: true, filename });
	} catch (e) {
		console.error("Write error:", e);
		res.status(500).json({ ok: false, error: String(e) });
	}
});

// ------------------------------------------------------------
// 本命：ガチャ保存（分割保存）
// POST /write-gacha
// body: {
//   gachaId: "gacha01",
//   selecMode: 0,
//   selectBody: "...",
//   selectBack: "...",
//   option: {...},
//   gachaData: [...]
// }
// ------------------------------------------------------------
app.post("/write-gacha", (req, res) => {
	try {
		const body = req.body || {};

		const gachaId = body.gachaId;
		if (!gachaId) {
			res.status(400).json({ ok: false, error: "gachaId is required" });
			return;
		}

		// 保存先フォルダ
		const baseDir = path.join(__dirname, "data");
		const metaDir = path.join(baseDir, "meta");
		const gachaDir = path.join(baseDir, "gacha");
		ensureDir(metaDir);
		ensureDir(gachaDir);

		// 分割データ
		const meta = {
			gachaId: gachaId,
			selecMode: body.selecMode,
			selectBody: body.selectBody,
			selectBack: body.selectBack,
			option: body.option || {}
		};

		const gacha = {
			gachaId: gachaId,
			gachaData: Array.isArray(body.gachaData) ? body.gachaData : []
		};

		// 保存
		const metaPath = path.join(metaDir, `${gachaId}.json`);
		const gachaPath = path.join(gachaDir, `${gachaId}.json`);

		saveJson(metaPath, meta);
		saveJson(gachaPath, gacha);

		console.log("Saved meta:", metaPath);
		console.log("Saved gacha:", gachaPath);

		res.json({
			ok: true,
			saved: true,
			metaFile: `meta/${gachaId}.json`,
			gachaFile: `gacha/${gachaId}.json`
		});
	} catch (e) {
		console.error("Write gacha error:", e);
		res.status(500).json({ ok: false, error: String(e) });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Server started on port", PORT);
});
