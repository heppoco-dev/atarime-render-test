const express = require("express");
const app = express();

// JSONを受け取れるようにする
app.use(express.json());

/* =========================
   ルート確認
========================= */
app.get("/", (req, res) => {
  res.send("Node server is running!");
});

/* =========================
   GET確認用（ブラウザで直接確認）
========================= */
app.get("/write-test", (req, res) => {
  res.send("POSTで /write-test にJSONを送ってください");
});

/* =========================
   書き込みテスト（POST）
========================= */
app.post("/write-test", (req, res) => {
  console.log("Received:", req.body);

  res.json({
    ok: true,
    received: req.body
  });
});

/* =========================
   サーバー起動
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
