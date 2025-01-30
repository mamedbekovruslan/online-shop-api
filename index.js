import express from "express";
import { router } from "./src/routes/index.js";

const app = express();

app.use(express.json());
app.use("/api", router);

app.get(
  "/users",
  (req, res, next) => {
    res.status(200).json();
    next();
  },
  router
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
