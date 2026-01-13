import express, { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  resetUserPassword,
  userForgotPassword,
  verifyUser,
  verifyUserForPasswordReset,
} from "../controllers/auth.controller";

const router: Router = express.Router();

router.get("/health", (req, res) => {
  res.send({ status: "Auth Service is healthy" });
});

router.post("/register-user", registerUser);
router.post("/verify-user", verifyUser);

router.post("/login-user", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);

router.post("/forgot-password", userForgotPassword);
router.post("/forgot-password/verify-otp", verifyUserForPasswordReset);
router.post("/forgot-password/reset", resetUserPassword);

export default router;
