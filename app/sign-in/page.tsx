import { Suspense } from "react";
import type { Metadata } from "next";
import AuthPageLayout from "@/src/components/auth/AuthPageLayout";
import LoginForm from "@/src/components/auth/LoginForm";
import SignInGate from "@/src/components/auth/SignInGate";
import PageLoader from "@/src/components/common/PageLoader";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your American Lighting account.",
};

export default function SignInPage() {
  return (
    <AuthPageLayout title="Login">
      <Suspense
        fallback={
          <PageLoader label="Loading…" minHeightClassName="min-h-[200px]" />
        }
      >
        <SignInGate>
          <LoginForm />
        </SignInGate>
      </Suspense>
    </AuthPageLayout>
  );
}
