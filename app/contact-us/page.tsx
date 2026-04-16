import type { Metadata } from "next";
import ContactUsForm from "@/src/components/contact/ContactUsForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with American Lighting.",
};

export default function ContactUsPage() {
  return (
    <div className="container py-10 md:py-14">
      <div className="max-w-3xl">
        <h1 className="page-title text-2xl md:text-3xl font-semibold text-black uppercase mb-8 md:mb-10">
          Contact Us
        </h1>
        <ContactUsForm />
      </div>
    </div>
  );
}
