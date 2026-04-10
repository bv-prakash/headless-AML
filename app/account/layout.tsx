import type { ReactNode } from "react";
import RequireAuth from "@/src/components/auth/RequireAuth";
import { MyAccountSidebar } from "@/src/components/account/MyAccountSidebar";
import { AccountBreadcrumbs } from "@/src/components/account/AccountBreadcrumbs";

type MyAccountLayoutProps = {
  readonly children: ReactNode;
};

export default function MyAccountLayout({ children }: MyAccountLayoutProps) {
  return (
    <RequireAuth>
      <div className="container relative mb-[25px] mt-5 lg-custom:mb-7.5!">
      {/* <Breadcrumbs items={myAccountNavItems} /> */}
      <AccountBreadcrumbs />
      
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
          <aside className="bg-white  shadow-[0_0_10px_rgba(0,0,0,0.1)]">
            <MyAccountSidebar />
          </aside>

          <div className="min-w-0 border border-aaa bg-white p-6">
            {children}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

