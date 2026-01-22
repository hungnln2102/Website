import express from "express";

const app = express();
const PORT = 4005;

app.get("/", (req, res) => {
  console.log("TEST SERVER: Root request received");
  res.send("TEST SERVER OK");
});

app.listen(PORT, () => {
  console.log(`TEST SERVER: Running on http://localhost:${PORT}`);
});
