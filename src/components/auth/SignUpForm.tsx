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
import { store } from "@/src/store/store";
import { login } from "@/src/store/slices/authSlice";
import { applySyncedCart, syncCartAfterLogin } from "@/src/framework/cart/syncCartAfterLogin";
import { CART_ID_KEY } from "@/src/constants/storageKeys";
import { getScopedStoredValue } from "@/src/utils/storage";
import {
  CREATE_CUSTOMER_MUTATION,
  GENERATE_CUSTOMER_TOKEN_MUTATION,
  type CreateCustomerResponse,
  type CreateCustomerVariables,
  type GenerateCustomerTokenResponse,
  type GenerateCustomerTokenVariables,
} from "@/src/framework/graphql/mutations/authMutations";
const PASSWORD_MIN_LENGTH = 8;

type SignUpFormValues = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  isSubscribed: boolean;
};

const INPUT_CLASS =
  "input-text w-full h-11 px-4 text-base border rounded bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary";

export default function SignUpForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({ mode: "onTouched" });

  const passwordValue = watch("password");

  const [createCustomer] = useMutation<
    CreateCustomerResponse,
    CreateCustomerVariables
  >(CREATE_CUSTOMER_MUTATION);

  const [generateToken] = useMutation<
    GenerateCustomerTokenResponse,
    GenerateCustomerTokenVariables
  >(GENERATE_CUSTOMER_TOKEN_MUTATION);

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      await createCustomer({
        variables: {
          input: {
            firstname: values.firstname.trim(),
            lastname: values.lastname.trim(),
            email: values.email.trim(),
            password: values.password,
            is_subscribed: values.isSubscribed,
          },
        },
      });

      const { data: tokenData } = await generateToken({
        variables: { email: values.email.trim(), password: values.password },
      });

      const token = tokenData?.generateCustomerToken?.token;
      if (token) {
        dispatch(
          login({
            token,
            customer: {
              firstname: values.firstname.trim(),
              lastname: values.lastname.trim(),
              email: values.email.trim(),
            },
          }),
        );

        const guestCartId =
          store.getState().cart.cartId ?? getScopedStoredValue(CART_ID_KEY);

        router.push("/");

        void (async () => {
          try {
            const synced = await syncCartAfterLogin(guestCartId, dispatch);
            if (synced) {
              applySyncedCart(dispatch, synced);
            }
          } catch {
            /* best-effort cart sync */
          }
          toast.success("Account created successfully.");
        })();
      } else {
        toast.success("Account created successfully.");
        router.push("/");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <form
      className="form form-signup w-full"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <fieldset className="fieldset signup">
        <legend className="sr-only">Create New Customer Account</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <div className="field firstname mb-5">
            <div className="control">
              <label htmlFor="signup-firstname" className="sr-only">
                First Name
              </label>
              <input
                id="signup-firstname"
                type="text"
                autoComplete="given-name"
                placeholder="First Name*"
                aria-invalid={!!errors.firstname}
                aria-describedby={
                  errors.firstname ? "signup-firstname-error" : undefined
                }
                {...register("firstname", {
                  required: "First name is required.",
                })}
                className={`${INPUT_CLASS} ${
                  errors.firstname ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.firstname && (
                <p
                  id="signup-firstname-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.firstname.message}
                </p>
              )}
            </div>
          </div>

          <div className="field lastname mb-5">
            <div className="control">
              <label htmlFor="signup-lastname" className="sr-only">
                Last Name
              </label>
              <input
                id="signup-lastname"
                type="text"
                autoComplete="family-name"
                placeholder="Last Name*"
                aria-invalid={!!errors.lastname}
                aria-describedby={
                  errors.lastname ? "signup-lastname-error" : undefined
                }
                {...register("lastname", {
                  required: "Last name is required.",
                })}
                className={`${INPUT_CLASS} ${
                  errors.lastname ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.lastname && (
                <p
                  id="signup-lastname-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {errors.lastname.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="field email mb-5">
          <div className="control">
            <label htmlFor="signup-email" className="sr-only">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="Email*"
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "signup-email-error" : undefined
              }
              {...register("email", {
                required: "Email is required.",
                pattern: emailValidation,
              })}
              className={`${INPUT_CLASS} ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p
                id="signup-email-error"
                className="text-red-400 text-sm mt-1"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="field password mb-5">
          <div className="control">
            <label htmlFor="signup-password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Password*"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "signup-password-error" : undefined
                }
                {...register("password", {
                  required: "Password is required.",
                  minLength: {
                    value: PASSWORD_MIN_LENGTH,
                    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
                  },
                  validate: (val) => {
                    const hasUpper = /[A-Z]/.test(val);
                    const hasLower = /[a-z]/.test(val);
                    const hasNumber = /\d/.test(val);
                    const hasSpecial = /[^A-Za-z0-9]/.test(val);
                    const classCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
                    if (classCount < 3) {
                      return "Password must contain at least 3 of: uppercase, lowercase, number, special character.";
                    }
                    return true;
                  },
                })}
                className={`${INPUT_CLASS} pr-12 ${
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
              <p
                id="signup-password-error"
                className="text-red-400 text-sm mt-1"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="field confirm-password mb-5">
          <div className="control">
            <label htmlFor="signup-confirm-password" className="sr-only">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm Password*"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword
                    ? "signup-confirm-password-error"
                    : undefined
                }
                {...register("confirmPassword", {
                  required: "Please confirm your password.",
                  validate: (val) =>
                    val === passwordValue || "Passwords do not match.",
                })}
                className={`${INPUT_CLASS} pr-12 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p
                id="signup-confirm-password-error"
                className="text-red-400 text-sm mt-1"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="field newsletter mb-5 flex items-center gap-2">
          <input
            type="checkbox"
            id="signup-subscribe"
            {...register("isSubscribed")}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-theme-primary"
          />
          <label
            htmlFor="signup-subscribe"
            className="text-black cursor-pointer select-none"
          >
            Subscribe to our mailing list
          </label>
        </div>

        <div className="field show-password mb-5 flex items-center gap-2">
          <input
            type="checkbox"
            id="signup-show-password"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-theme-primary"
          />
          <label
            htmlFor="signup-show-password"
            className="text-black cursor-pointer select-none"
          >
            Show Password
          </label>
        </div>

        <div className="primary mb-5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            loadingLabel="Creating account…"
            className="w-full text-lg uppercase"
          >
            Create Account
          </Button>
        </div>

        <div className="already-have-account text-center uppercase">
          <span className="text-black">Already have an account? </span>
          <Link
            href="/sign-in"
            className="text-theme-primary underline hover:no-underline font-semibold"
          >
            Login
          </Link>
        </div>
      </fieldset>
    </form>
  );
}
