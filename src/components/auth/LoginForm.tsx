"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import Link from "next/link";
import Button from "@/src/components/common/Button";
import { emailValidation } from "@/src/utils/validation";
import { useAppDispatch } from "@/src/store/hooks";
import { login } from "@/src/store/slices/authSlice";
import {
  GENERATE_CUSTOMER_TOKEN_MUTATION,
  type GenerateCustomerTokenResponse,
  type GenerateCustomerTokenVariables,
} from "@/src/framework/graphql/mutations/authMutations";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ mode: "onTouched" });

  const [generateToken] = useMutation<
    GenerateCustomerTokenResponse,
    GenerateCustomerTokenVariables
  >(GENERATE_CUSTOMER_TOKEN_MUTATION);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { data } = await generateToken({
        variables: { email: values.email.trim(), password: values.password },
      });

      const token = data?.generateCustomerToken?.token;
      if (!token) {
        toast.error("Login failed. Please try again.");
        return;
      }

      dispatch(login({ token }));
      toast.success("Signed in successfully.");
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <form
      className="form form-login w-full"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <fieldset className="fieldset login">
        <legend className="sr-only">Customer Login</legend>

        <div className="field email mb-5">
          <div className="control">
            <label htmlFor="login-email" className="sr-only">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Email*"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              {...register("email", {
                required: "Email is required.",
                pattern: emailValidation,
              })}
              className={`input-text w-full h-11 px-4 text-base border rounded bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p id="login-email-error" className="text-red-400 mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="field password mb-5">
          <div className="control">
            <label htmlFor="login-password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password*"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                {...register("password", {
                  required: "Password is required.",
                })}
                className={`input-text w-full h-11 px-4 pr-12 text-base border rounded bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <i
                  className={`${showPassword ? "icon-eye-hide" : "icon-eye-view"} text-lg leading-none`}
                  aria-hidden="true"
                />
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-red-400 text-sm mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="choice mt-2.5 flex items-center gap-2">
            <input
              type="checkbox"
              id="show-password-checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-theme-primary"
            />
            <label
              htmlFor="show-password-checkbox"
              className="text-black cursor-pointer select-none"
            >
              Show Password
            </label>
          </div>
        </div>

        <div className="forgot-password mb-5 md:mb-7.5 text-center">
          <span className="text-black">Forgot Your </span>
          <Link
            href="/forgot-password"
            className="text-theme-primary underline hover:no-underline font-semibold"
          >
            Password?
          </Link>
        </div>

        <div className="primary mb-5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            loadingLabel="Signing in…"
            className="w-full text-lg uppercase"
          >
            Login
          </Button>
        </div>

        <div className="request-access text-center uppercase">
          <span className="text-black">or </span>
          <Link
            href="/sign-up"
            className="text-theme-primary underline hover:no-underline font-semibold"
          >
            Sign up
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
