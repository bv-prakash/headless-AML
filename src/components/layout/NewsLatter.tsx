"use client";

import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import { emailValidation } from "@/src/utils/validation";
import {
  NEWSLETTER_SUBSCRIBE_MUTATION,
  type NewsletterSubscribeVariables,
  type NewsletterSubscribeResponse,
} from "@/src/framework/graphql/newsletter/mutations/subscribeNewsletter";

type NewsletterFormValues = {
  email: string;
};

const NewsLatter = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues>({ mode: "onTouched" });

  const [newsletterSubscribe] = useMutation<
    NewsletterSubscribeResponse,
    NewsletterSubscribeVariables
  >(NEWSLETTER_SUBSCRIBE_MUTATION);

  const onSubmit = async (values: NewsletterFormValues) => {
    try {
      const { data } = await newsletterSubscribe({
        variables: { email: values.email.trim() },
      });

      if (data?.subscribeEmailToNewsletter?.status === "SUBSCRIBED") {
        toast.success("Email subscribed successfully");
        reset();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="block newsletter md:max-w-100 mt-5 mb-7.5 md:w-[39%] md:mt-0 lg-custom:w-full!">
      <div className="newsletter-title text-base font-bold leading-[1.1] mb-[15px] lg:mb-[17px]">
        SUBSCRIBE TO OUR MAILING LIST
      </div>
      <form
        className="form subscribe flex flex-nowrap items-baseline"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="field newsletter rtl:ml-0 ltr:mr-0 rtl:md:ml-[5px] ltr:md:mr-[5px] w-full">
          <div className="control">
            <label htmlFor="newsletter" className="newslatter-label sr-only">
              Subscribe
            </label>
            <input
              type="email"
              id="newsletter"
              placeholder="Email address"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "newsletter-email-error" : undefined}
              {...register("email", {
                required: "Email is required.",
                pattern: emailValidation,
              })}
              className={`text-base h-9 pl-3 w-full focus:outline-none focus:ring-0 focus:border-theme-primary px-5 bg-white text-black border border-solid rounded-none leading-[1.3] placeholder:text-aaa ${
                errors.email ? "border-red-500" : "border-aaa"
              }`}
              suppressHydrationWarning
            />
            {errors.email && (
              <p id="newsletter-email-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
        <div className="actions rtl:mr-2.5 ltr:ml-2.5 min-w-[100px] w-auto lg:min-w-[120px]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="subscribe w-full cursor-pointer text-sm leading-normal px-2.5 py-1.5 h-9 border-3 border-solid border-theme-primary bg-theme-primary text-white font-bold align-middle hover:bg-transparent hover:border-white disabled:opacity-50"
            aria-label="Subscribe"
          >
            <span>{isSubmitting ? "Sending…" : "JOIN"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsLatter;
