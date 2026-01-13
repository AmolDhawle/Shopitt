import bcrypt from "bcryptjs";
import { prisma } from "@shopitt/prisma-client";
import { resetUserPassword } from "../../controllers/auth.controller";

jest.mock("../../utils/auth.helper", () => ({
  verifyOtp: jest.fn().mockResolvedValue(true),
  markPasswordResetVerified: jest.fn().mockResolvedValue(undefined),
  isPasswordResetVerified: jest.fn().mockResolvedValue(true),
  clearPasswordResetState: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@shopitt/prisma-client");
jest.mock("bcryptjs");

beforeEach(() => {
  jest.clearAllMocks();

  (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

  (prisma.users.findUnique as jest.Mock).mockResolvedValue({
    id: "user-id",
    email: "test@mail.com",
    password: "old-hash",
    isVerified: true,
  });
});

(prisma.users.update as jest.Mock).mockResolvedValue({});
(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({});

describe("Auth Controller – Reset Password", () => {
  const req: any = {
    body: {
      email: "test@mail.com",
      newPassword: "newPassword123",
    },
  };

  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset password and invalidate refresh tokens", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        otp: "123456",
        newPassword: "newPassword123",
      },
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    (prisma.users.findUnique as jest.Mock).mockResolvedValue({
      id: "user-id",
      email: "test@mail.com",
      password: "old-hash",
      isVerified: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

    await resetUserPassword(req, res, next);

    expect(prisma.users.update).toHaveBeenCalledWith({
      where: { email: "test@mail.com" },
      data: { password: "hashed-password" },
    });
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-id" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Password reset successfully.",
    });
  });

  it("should throw error if user does not exist", async () => {
    (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

    await resetUserPassword(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
