'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import GoogleButton from '../../../shared/components/google-button';
import { Eye, EyeOff } from 'lucide-react';
import { watch } from 'fs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/login-user`,
        data,
        { withCredentials: true },
      );

      return response.data;
    },
    onSuccess: (data) => {
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/');
    },
    onError: (error: AxiosError) => {
      const errorMessage =
        (error.response?.data as { message?: string })?.message ||
        'Invalid credentials!';
      setServerError(errorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };
  return (
    <div className="w-full py-4 md:py-10 min-h-[85vh] bg-[#f1f1f1]">
      <div className="w-full flex justify-center">
        <div className=" md:w-[480px] px-12">
          <h1 className="text-2xl md:text-4xl font-Poppins font-semibold text-black text-center">
            Welcome Back
          </h1>
          <p className="text-center md:text-lg font-medium py-3 text-[#00000099]">
            Log in to your account to continue
          </p>
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-4 md:p-8 bg-white shadow rounded-lg">
          <h3 className="text-center text-xl font-semibold mb-2">
            Login to Shopitt
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-500">
              Sign up
            </Link>
          </p>

          <GoogleButton />
          <div className="flex items-center my-2 md:my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Log In with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  {passwordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              {/* Password error */}
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="
                w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white
                hover:bg-gray-900 transition
                disabled:opacity-60
              "
            >
              {loginMutation?.isPending ? 'Logging in ...' : 'Log in'}
            </button>

            {serverError && (
              <p className="mt-3 text-sm text-red-500 text-left">
                {serverError}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
