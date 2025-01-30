import express from "express";
import cors from "cors";
import { router } from "./src/routes/index.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
