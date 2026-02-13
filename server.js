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
// 本命：ガチャ保存（分割保存 + user/fileId 階層 + overwrite判定）
// POST /write-gacha
// body: {
//   fileId: "xxxx",      // ユーザー識別（フォルダ名）
//   gachaId: "gacha01",
//   meta: { selecMode, selectBody, selectBack, option },
//   gacha: { selecMode, gachaData }
// }
// ------------------------------------------------------------
app.post("/write-gacha", (req, res) => {
	try {
		const body = req.body || {};

		const fileId = body.fileId;
		const gachaId = body.gachaId;

		if (!fileId) {
			res.status(400).json({ ok: false, error: "fileId is required" });
			return;
		}
		if (!gachaId) {
			res.status(400).json({ ok: false, error: "gachaId is required" });
			return;
		}

		// meta / gacha を取り出す（ネスト想定）
		const metaIn = body.meta || {};
		const gachaIn = body.gacha || {};

		// 最低限チェック
		const selecMode = metaIn.selecMode;
		const gachaData = gachaIn.gachaData;

		if (selecMode == null) {
			res.status(400).json({ ok: false, error: "meta.selecMode is required" });
			return;
		}
		if (!Array.isArray(gachaData)) {
			res.status(400).json({ ok: false, error: "gacha.gachaData must be array" });
			return;
		}

		// 保存先（users/fileId/gachaId/）
		const baseDir = path.join(__dirname, "data", "users", String(fileId), String(gachaId));
		ensureDir(baseDir);

		const metaPath = path.join(baseDir, "meta.json");
		const gachaPath = path.join(baseDir, "gacha.json");

		// 追加：保存前に存在してたか（＝上書きになるか）
		const metaExists = fs.existsSync(metaPath);
		const gachaExists = fs.existsSync(gachaPath);
		const overwrite = (metaExists || gachaExists);

		// あれば上書き / なければ新規作成
		saveJson(metaPath, metaIn);
		saveJson(gachaPath, gachaIn);

		console.log("Saved meta:", metaPath);
		console.log("Saved gacha:", gachaPath);

		res.json({
			ok: true,
			saved: true,
			overwrite: overwrite,
			metaFile: `users/${fileId}/${gachaId}/meta.json`,
			gachaFile: `users/${fileId}/${gachaId}/gacha.json`
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






// ------------------------------------------------------------
// 読み込み：ガチャ取得（実感用）
// GET /get-gacha?fileId=xxx&gachaId=gacha01
// ------------------------------------------------------------
app.get("/get-gacha", (req, res) => {
	try {
		const fileId = req.query.fileId;
		const gachaId = req.query.gachaId;

		if (!fileId) {
			res.status(400).json({ ok: false, error: "fileId is required" });
			return;
		}
		if (!gachaId) {
			res.status(400).json({ ok: false, error: "gachaId is required" });
			return;
		}

		const baseDir = path.join(__dirname, "data", "users", String(fileId), String(gachaId));
		const metaPath = path.join(baseDir, "meta.json");
		const gachaPath = path.join(baseDir, "gacha.json");

		if (!fs.existsSync(metaPath) || !fs.existsSync(gachaPath)) {
			res.status(404).json({ ok: false, error: "not found" });
			return;
		}

		const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
		const gacha = JSON.parse(fs.readFileSync(gachaPath, "utf8"));

		res.json({
			ok: true,
			fileId: String(fileId),
			gachaId: String(gachaId),
			meta: meta,
			gacha: gacha
		});
	} catch (e) {
		console.error("Get gacha error:", e);
		res.status(500).json({ ok: false, error: String(e) });
	}
});

