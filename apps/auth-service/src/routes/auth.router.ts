import express, { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  verifyUser,
} from "../controllers/auth.controller";

const router: Router = express.Router();

router.get("/health", (req, res) => {
  res.send({ status: "Auth Service is healthy" });
});

router.post("/register-user", registerUser);
router.post("/verify-user", verifyUser);

router.post("/refresh", refreshToken);

router.post("/login-user", loginUser);
router.post("/logout", logoutUser);

export default router;
