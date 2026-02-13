const express = require("express");
const app = express();

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
