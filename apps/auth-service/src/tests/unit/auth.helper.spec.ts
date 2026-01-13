import {
  sendOtp,
  verifyOtp,
  markPasswordResetVerified,
  isPasswordResetVerified,
} from "../../utils/auth.helper";
import { redis } from "@shopitt/redis";
import { ValidationError } from "@shopitt/error-handler";

jest.mock("@shopitt/redis");
jest.mock("../../utils/sendMailWithOtp");

describe("Auth Helper – OTP Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send OTP and store it in redis", async () => {
    await sendOtp("Amol", "test@mail.com", "template");

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining("otp:test@mail.com"),
      expect.any(String),
      "EX",
      expect.any(Number)
    );
  });

  it("should verify correct OTP", async () => {
    (redis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("123456");

    await expect(verifyOtp("test@mail.com", "123456")).resolves.not.toThrow();
  });

  it("should fail on wrong OTP", async () => {
    (redis.get as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("111111");

    await expect(verifyOtp("test@mail.com", "123456")).rejects.toThrow(
      ValidationError
    );
  });

  it("should lock user after max OTP attempts", async () => {
    (redis.get as jest.Mock).mockResolvedValue("111111");
    (redis.incr as jest.Mock).mockResolvedValue(5);

    await expect(verifyOtp("test@mail.com", "123456")).rejects.toThrow(
      ValidationError
    );
  });

  it("should mark password reset verified", async () => {
    await markPasswordResetVerified("test@mail.com");

    expect(redis.set).toHaveBeenCalledWith(
      "password_reset_verified:test@mail.com",
      "1",
      "EX",
      900
    );
  });

  it("should return true if password reset is verified", async () => {
    (redis.get as jest.Mock).mockResolvedValue("1");

    const result = await isPasswordResetVerified("test@mail.com");
    expect(result).toBe(true);
  });
});
