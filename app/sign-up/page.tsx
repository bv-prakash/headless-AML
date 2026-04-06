import type { Metadata } from "next";
import AuthPageLayout from "@/src/components/auth/AuthPageLayout";
import SignUpForm from "@/src/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new American Lighting customer account.",
};

export default function SignUpPage() {
  return (
    <AuthPageLayout title="Create Account">
      <SignUpForm />
    </AuthPageLayout>
  );
}
