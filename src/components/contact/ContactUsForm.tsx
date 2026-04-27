"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client/react";
import { toast } from "react-toastify";
import Button from "@/src/components/common/Button";
import { emailValidation } from "@/src/utils/validation";
import { getErrorMessage } from "@/src/utils/errors";
import {
  CONTACT_US_MUTATION,
  type ContactUsResponse,
  type ContactUsVariables,
} from "@/src/framework/graphql/mutations/contactUsMutation";

const INPUT_CLASS =
  "input-text w-full h-11 px-4 text-base border rounded bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary";

type ContactUsFormValues = {
  name: string;
  company: string;
  number: string;
  role: string;
  email: string;
  location: string;
  message: string;
};

function buildComment(values: ContactUsFormValues): string {
  const lines = [
    values.company.trim() && `Company or Agency: ${values.company.trim()}`,
    values.role.trim() && `Role: ${values.role.trim()}`,
    values.location.trim() && `Company Location: ${values.location.trim()}`,
    values.message.trim() && `What can we assist you with:\n${values.message.trim()}`,
  ].filter(Boolean) as string[];
  return lines.length ? lines.join("\n\n") : "—";
}

export default function ContactUsForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactUsFormValues>({
    mode: "onTouched",
    defaultValues: {
      name: "",
      company: "",
      number: "",
      role: "",
      email: "",
      location: "",
      message: "",
    },
  });

  const [contactUsMut] = useMutation<ContactUsResponse, ContactUsVariables>(CONTACT_US_MUTATION);

  const onSubmit = async (values: ContactUsFormValues) => {
    try {
      const { data, error: gqlError } = await contactUsMut({
        variables: {
          input: {
            name: values.name.trim(),
            email: values.email.trim(),
            telephone: values.number.trim() || undefined,
            comment: buildComment(values),
          },
        },
      });

      if (gqlError) {
        toast.error(getErrorMessage(gqlError, "Your message could not be sent."));
        return;
      }

      if (data?.contactUs?.status !== true) {
        toast.error("Your message could not be sent. Please try again.");
        return;
      }

      reset();
      toast.success("Thank you for contacting us. We will respond soon.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Something went wrong. Please try again."));
    }
  };

  const fieldError = (name: keyof ContactUsFormValues) =>
    errors[name] ? "border-red-500" : "border-gray-300";

  return (
    <form
      id="bv-contact-us"
      className="form contact-us w-full max-w-3xl"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <fieldset className="fieldset border-0 m-0 p-0 min-w-0">
        <div className="feedback-container">
          <legend className="legend text-xl md:text-2xl font-semibold text-black mb-6 block w-full">
            <span>EMAIL US</span>
          </legend>

          <div className="form-content space-y-5">
            <div className="form-group grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
              <div className="field field-name required">
                <div className="control">
                  <label htmlFor="name" className="common-label-hide sr-only">
                    name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    aria-label="Your Name"
                    placeholder="Your Name*"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    className={`${INPUT_CLASS} required-entry ${fieldError("name")}`}
                    {...register("name", { required: "Name is required." })}
                  />
                  {errors.name ? (
                    <p className="text-red-400 text-sm mt-1" role="alert">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="field field-company required">
                <div className="control">
                  <label htmlFor="company" className="common-label-hide sr-only">
                    company
                  </label>
                  <input
                    id="company"
                    type="text"
                    autoComplete="organization"
                    aria-label="Company or Agency"
                    placeholder="Company or Agency*"
                    title="Company"
                    aria-required="true"
                    aria-invalid={!!errors.company}
                    className={`${INPUT_CLASS} required-entry ${fieldError("company")}`}
                    {...register("company", { required: "Company is required." })}
                  />
                  {errors.company ? (
                    <p className="text-red-400 text-sm mt-1" role="alert">
                      {errors.company.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="field field-number">
                <div className="control">
                  <label htmlFor="number" className="common-label-hide sr-only">
                    number
                  </label>
                  <input
                    id="number"
                    type="tel"
                    autoComplete="tel"
                    aria-label="Phone Number"
                    placeholder="Phone Number*"
                    title="Number"
                    aria-required="true"
                    aria-invalid={!!errors.number}
                    className={`${INPUT_CLASS} required-entry ${fieldError("number")}`}
                    {...register("number", { required: "Phone number is required." })}
                  />
                  {errors.number ? (
                    <p className="text-red-400 text-sm mt-1" role="alert">
                      {errors.number.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="field field-role">
                <div className="control">
                  <label htmlFor="role" className="common-label-hide sr-only">
                    role
                  </label>
                  <input
                    id="role"
                    type="text"
                    aria-label="Role (i.e.: Distributor, Showroom, Contractor)"
                    placeholder="Role (i.e.: Distributor, Showroom, Contractor):"
                    title="Role"
                    aria-required="true"
                    className={`${INPUT_CLASS} ${fieldError("role")}`}
                    {...register("role")}
                  />
                </div>
              </div>

              <div className="field field-email required">
                <div className="control">
                  <label htmlFor="email" className="common-label-hide sr-only">
                    email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-label="Email"
                    title="Email"
                    placeholder="Email*"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    className={`${INPUT_CLASS} required-entry ${fieldError("email")}`}
                    {...register("email", {
                      required: "Email is required.",
                      pattern: emailValidation,
                    })}
                  />
                  {errors.email ? (
                    <p className="text-red-400 text-sm mt-1" role="alert">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="field field-location">
                <div className="control">
                  <label htmlFor="location" className="common-label-hide sr-only">
                    location
                  </label>
                  <input
                    id="location"
                    type="text"
                    aria-label="Company Location"
                    placeholder="Company Location:"
                    title="Company Location"
                    aria-required="true"
                    className={`${INPUT_CLASS} ${fieldError("location")}`}
                    {...register("location")}
                  />
                </div>
              </div>
            </div>

            <div className="field field-assist">
              <div className="control">
                <label htmlFor="message-form" className="common-label-hide sr-only">
                  message
                </label>
                <textarea
                  id="message-form"
                  rows={7}
                  aria-label="What Can We Assist You With?"
                  placeholder="What Can We Assist You With?:"
                  className={`form-control w-full px-4 py-3 text-base border rounded bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-primary ${fieldError("message")}`}
                  {...register("message")}
                />
              </div>
            </div>

            <div className="field field-submit pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="button action primary w-full md:w-auto min-w-[200px]"
                loading={isSubmitting}
                loadingLabel="Sending"
              >
                <span>Submit</span>
              </Button>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
