"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client/react";
import {
  NEWSLETTER_SUBSCRIBE_MUTATION,
  type NewsletterSubscribeVariables,
  type NewsletterSubscribeResponse,
} from "../../framework/graphql/mutations/newslatterSubscribe";

type FormErrors = {
  email?: string;
};

function validateEmail(email: string): FormErrors {
  if (!email) return { email: "Email is required" };
  if (!email.includes("@") || !email.includes(".")) return { email: "Invalid email" };
  return {};
}

const NewsLatter = () => {
  const [email, setEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const [newsletterSubscribe, { loading }] = useMutation<
    NewsletterSubscribeResponse,
    NewsletterSubscribeVariables
  >(NEWSLETTER_SUBSCRIBE_MUTATION);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateEmail(email);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});

    try {
      const { data } = await newsletterSubscribe({
        variables: { email },
      });

      if (data?.subscribeEmailToNewsletter?.status === "SUBSCRIBED") {
        toast.success("Email subscribed successfully");
        setEmail("");
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
        className="form subscribe flex flex-nowrap gap items-baseline"
        onSubmit={handleSubmit}
      >
        <div className="field newsletter mr-0 md:mr-[5px] w-full">
          <div className="control">
            <label htmlFor="newsletter" className="newslatter-label sr-only">
              Subscribe
            </label>
            <input
              type="email"
              id="newsletter"
              placeholder="Email address"
              aria-required="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base h-9 pl-3 w-full focus:outline-none focus:ring-0 focus:border-theme-primary px-5 bg-white text-black border border-solid border-aaa rounded-none leading-[1.3] placeholder:text-aaa"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm">{validationErrors.email}</p>
            )}
          </div>
        </div>
        <div className="actions ml-2.5 w-auto lg:min-w-[120px]">
          <button
            type="submit"
            disabled={loading}
            className="subscribe w-full cursor-pointer text-sm leading-normal px-2.5 py-1.5 h-9 border-3 border-solid border-theme-primary bg-theme-primary text-white font-bold align-middle hover:bg-transparent hover:border-white disabled:opacity-50"
            aria-label="Subscribe"
          >
            <span>{loading ? "Sending…" : "JOIN"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsLatter;
