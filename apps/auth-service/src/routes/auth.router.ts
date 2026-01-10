import express, { Router } from "express";
import { registerUser, verifyUser } from "../controllers/auth.controller";

const router: Router = express.Router();

router.get("/health", (req, res) => {
  res.send({ status: "Auth Service is healthy" });
});

router.post("/user-registration", registerUser);
router.post("/verify-user", verifyUser);

router.post("/user-login", (req, res) => {
  // Placeholder for user login logic
  res.send({ message: "User login endpoint" });
});

export default router;
