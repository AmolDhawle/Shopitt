'use client';
import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { PhoneInput } from '@shopitt/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import CreateShop from '../../../shared/modules/create-shop';
import { StripeLogo } from 'apps/seller-ui/src/assets/svgs/stripe-logo';

type FormData = {
  name: string;
  email: string;
  password: string;
  country_code: string;
  phone_number: string;
};

type FormFields = FormData & {
  confirmPassword?: string;
};

const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', score, color: 'bg-red-500' };
  if (score <= 3) return { label: 'Medium', score, color: 'bg-yellow-500' };
  return { label: 'Strong', score, color: 'bg-green-500' };
};

const Signup = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sellerData, setSellerData] = useState<FormData | null>(null);
  const [sellerId, setSellerId] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const methods = useForm<FormFields>({
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = methods;

  const passwordValue = watch('password', '');
  const confirmPasswordValue = watch('confirmPassword', '');
  const strength = getPasswordStrength(passwordValue);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value.length > 1) {
      value.split('').forEach((char, i) => {
        if (index + i < otp.length) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
    }
  };

  const handleOtpPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();

    const pasteData = e.clipboardData.getData('text').replace(/\D/g, ''); // numbers only

    if (!pasteData) return;

    const newOtp = [...otp];

    pasteData.split('').forEach((char, i) => {
      if (index + i < otp.length) {
        newOtp[index + i] = char;
      }
    });

    setOtp(newOtp);

    const nextIndex = Math.min(index + pasteData.length, otp.length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = () => {
    if (sellerData) {
      signupMutation.mutate(sellerData);
    }
  };

  const startResendTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log(process.env.NEXT_PUBLIC_SERVER_URI);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/register-seller`,
        data,
        { withCredentials: true },
      );
      console.log(process.env.NEXT_PUBLIC_SERVER_URI);
      return response.data;
    },
    onSuccess: (_, formData) => {
      setSellerData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!sellerData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-seller`,
        {
          ...sellerData,
          otp: otp.join(''),
        },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSellerId(data?.seller?.id);
      setActiveStep(2);
    },
  });

  const axiosError = verifyOtpMutation.error as AxiosError<{ message: string }>;

  const onSubmit = (data: FormData) => {
    console.log('FormData!', data);
    signupMutation.mutate(data);
  };

  const connectPayment = async () => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/payment/onboard`,
        {},
        { withCredentials: true },
      );

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Payment onboarding error', err);
    }
  };

  useEffect(() => {
    if (confirmPasswordValue && confirmPasswordValue !== passwordValue) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
    } else {
      clearErrors('confirmPassword');
    }
  }, [confirmPasswordValue, passwordValue, setError, clearErrors]);

  return (
    <div className="w-full flex flex-col items-center pt-10 min-h-screen">
      {/* Stepper */}
      <div className="relative flex items-center justify-between md:w-[50%] mb-8">
        <div className="absolute top-[25%] left-0 md:left-[-4px] xl:left-4 w-[80%] md:w-[90%] h-1 bg-gray-300 -z-10" />
        {[1, 2, 3].map((step) => (
          <div key={step}>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold ${step <= activeStep ? 'bg-blue-600' : 'bg-blue-300'}`}
            >
              {step}
            </div>
            <span className="ml-[-15px]">
              {step === 1
                ? 'Create account'
                : step === 2
                  ? 'Setup Shop'
                  : 'Connect Bank'}
            </span>
          </div>
        ))}
      </div>
      {/* Steps Content */}
      <div className="md:w-[480px] p-4 md:p-8 bg-white shadow rounded-lg">
        {activeStep === 1 && (
          <FormProvider {...methods}>
            {!showOtp ? (
              <form
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Seller signup form"
                noValidate
              >
                <h3 className="text-2xl md:text-4xl font-Poppins font-semibold text-black text-center">
                  Create your seller account
                </h3>
                <p className="text-center md:text-lg font-medium py-3 text-[#00000099]">
                  <span>
                    Reach more customers, manage orders, and grow your
                    business—all in one place.
                  </span>
                </p>
                {/* Name */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>

                  <input
                    id="name"
                    type="name"
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`
                  w-full rounded-md border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.name ? 'border-red-500' : 'border-gray-300'}
                `}
                    {...register('name', {
                      required: 'Name is required',
                    })}
                  />

                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="johndoe@example.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`
                  w-full rounded-md border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}
                `}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />

                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <PhoneInput />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={passwordVisible ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      autoComplete="current-password"
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? 'password-error' : undefined
                      }
                      className={`
                    w-full rounded-md border px-3 py-2 text-sm pr-10
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.password ? 'border-red-500' : 'border-gray-300'}
                  `}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                        pattern: {
                          value:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
                          message:
                            'Password must include uppercase, lowercase, number, and special character',
                        },
                      })}
                    />

                    {/* Eye icon */}
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      aria-label={
                        passwordVisible ? 'Hide password' : 'Show password'
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      {passwordVisible ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>

                  {/* PASSWORD STRENGTH */}
                  {passwordValue && (
                    <div className="mt-2">
                      <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${strength.color}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Password strength:{' '}
                        <span className="font-medium">{strength.label}</span>
                      </p>
                    </div>
                  )}

                  {/* Password error */}
                  {errors.password && (
                    <p
                      id="password-error"
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="mb-4">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={passwordVisible ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      autoComplete="current-password"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? 'confirmPassword-error'
                          : undefined
                      }
                      className={`w-full rounded-md border px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      {...register('confirmPassword', {
                        required: 'Confirm Password is required',
                        validate: (value) =>
                          value === passwordValue || 'Passwords do not match',
                      })}
                    />

                    <button
                      type="button"
                      onClick={() => setPasswordVisible((v) => !v)}
                      aria-label={
                        passwordVisible ? 'Hide password' : 'Show password'
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      {passwordVisible ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="
                w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white
                hover:bg-gray-900 transition
                disabled:opacity-60
              "
                >
                  {signupMutation.isPending ? 'Signing up ...' : 'Sign up'}
                </button>
                {signupMutation.isError &&
                  signupMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-2">
                      {signupMutation.error.response?.data?.message ||
                        signupMutation.error.message}
                    </p>
                  )}
                <p className="pt-3 text-center">
                  Already have an account?{' '}
                  <Link href={'/login'} className="text-blue-500">
                    Login
                  </Link>
                </p>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-center mb-4">
                  Enter OTP
                </h3>
                <div className="flex justify-center gap-4 md:gap-6">
                  {otp?.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      ref={(el) => {
                        if (el) inputRefs.current[index] = el;
                      }}
                      maxLength={1}
                      className="w-10 md:w-12 h-12 text-center border border-gray-300 outline-none !rounded"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={(e) => handleOtpPaste(index, e)}
                    />
                  ))}
                </div>
                <button
                  className="w-full mt-4 text-lg cursor-pointer bg-black text-white py-2 rounded-lg"
                  disabled={verifyOtpMutation.isPending}
                  onClick={() => verifyOtpMutation.mutate()}
                >
                  {verifyOtpMutation.isPending ? 'Verifying' : 'Verify OTP'}
                </button>
                <p className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={resendOtp}
                      className="text-blue-500 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </p>
                {verifyOtpMutation?.isError &&
                  verifyOtpMutation.error instanceof AxiosError && (
                    <p className="text-red-500 text-sm mt-2">
                      {axiosError.response?.data?.message ||
                        verifyOtpMutation.error?.message}
                    </p>
                  )}
              </div>
            )}
          </FormProvider>
        )}
        {activeStep === 2 && (
          <CreateShop sellerId={sellerId} setActiveStep={setActiveStep} />
        )}
        {activeStep === 3 && (
          <div className="text-center">
            <h3 className="text-2xl font-semibold">Withdraw Method</h3>
            <br />
            <button
              className="w-full m-auto flex items-center justify-center gap-3 text-lg bg-[#334155] text-white py-2 rounded-lg"
              onClick={connectPayment}
            >
              Connect Payment <StripeLogo />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
