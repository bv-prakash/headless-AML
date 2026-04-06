import type { ReactNode } from "react";
import BackgroundImage from "@/public/images/login-bg.jpg";

type AuthPageLayoutProps = {
  readonly title: string;
  readonly children: ReactNode;
};

export default function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <div
      className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-cover bg-center bg-no-repeat py-10 px-4"
      style={{ backgroundImage: `url('${BackgroundImage.src}')` }}
    >
      <div className="w-full max-w-[540px] mx-auto my-10 shadow-[0_3px_20px_rgba(0,0,0,0.2)] bg-white px-5 py-7.5 md:p-[70px]">
        <div className="page-title-wrapper mb-6">
          <h1 className="page-title text-center mb-5 md:mb-7.5 uppercase">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
