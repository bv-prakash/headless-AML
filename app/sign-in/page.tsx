import type { Metadata } from "next";
import AuthPageLayout from "@/src/components/auth/AuthPageLayout";
import LoginForm from "@/src/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your American Lighting account.",
};

export default function SignInPage() {
  return (
    <AuthPageLayout title="Login">
      <LoginForm />
    </AuthPageLayout>
  );
}
