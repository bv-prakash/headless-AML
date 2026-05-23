"use client";

import { useQuery } from "@apollo/client/react";
import { AccountPageTitle } from "@/src/components/account/AccountPageTitle";
import { InformationBox } from "@/src/components/account/InformationBox";
import PageLoader from "@/src/components/common/PageLoader";
import { getErrorMessage } from "@/src/utils/errors";
import {
  GET_COMPANY_PROFILE_QUERY,
  type CompanyProfileResponse,
} from "@/src/framework/graphql/company-profile/queries/getCompanyProfile";
import {
  formatPersonName,
  paymentMethodLabel,
  shippingMethodLabel,
} from "@/src/components/account/company-profile/profileLabels";
import { useCompanyShippingMethods } from "@/src/hooks/useCompanyShippingMethods";

/** Block heading reused across the account section (Dashboard, Address Book, etc.). */
const BLOCK_TITLE_CLASS =
  "block-title font-normal text-black text-lg leading-[23px] md:text-2xl md:leading-[30px] mb-[15px] md:mb-5";

/**
 * Single key/value row inside an `InformationBox`. Renders nothing when value
 * is missing so empty Magento fields don't leave dangling labels.
 */
function InfoRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex flex-wrap gap-x-2 leading-relaxed">
      <span className="font-semibold">{label}:</span>
      <span className="wrap-break-word">{value}</span>
    </div>
  );
}

export default function CompanyProfilePageContent() {
  const { data, loading, error, refetch } = useQuery<CompanyProfileResponse>(
    GET_COMPANY_PROFILE_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  /**
   * Magento's storefront GraphQL does not expose `Company.shipping_methods`,
   * so the real "Applicable Shipping Methods" list (Admin → Customer Group →
   * Advanced Settings) is pulled via the `/api/company/advanced-settings`
   * server route, which bridges the admin REST API server-side.
   */
  const { data: shippingAdvanced, loading: shippingLoading } =
    useCompanyShippingMethods(!loading && !!data?.company);

  if (loading && !data) {
    return <PageLoader label="Loading company profile…" minHeightClassName="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <AccountPageTitle />
        <p className="text-light-red text-sm m-0" role="alert">
          {getErrorMessage(error, "Could not load company profile.")}
        </p>
        <button
          type="button"
          className="text-sm text-theme-primary underline"
          onClick={() => void refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  const company = data?.company ?? null;
  if (!company) {
    return (
      <div className="space-y-3">
        <AccountPageTitle />
        <p className="text-sm text-gray-600 m-0">
          You are not a member of any company.
        </p>
      </div>
    );
  }

  const admin = company.company_admin;
  const rep = company.sales_representative;
  const paymentMethods = company.payment_methods ?? [];

  /* ── Card contents ─────────────────────────────────────────── */

  const accountInfoContent = (
    <div className="space-y-1">
      <InfoRow label="Company Name" value={company.name ?? "—"} />
      <InfoRow label="Legal Name" value={company.legal_name} />
      <InfoRow label="Email" value={company.email ? (
        <a className="text-theme-primary hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
      ) : null} />
      <InfoRow label="VAT / Tax ID" value={company.vat_tax_id} />
      <InfoRow label="Reseller ID" value={company.reseller_id} />
    </div>
  );

  const adminContent = admin ? (
    <p className="m-0">
      <strong className="block">{formatPersonName(admin)}</strong>
      {admin.email ? (
        <a className="text-theme-primary hover:underline" href={`mailto:${admin.email}`}>
          {admin.email}
        </a>
      ) : null}
    </p>
  ) : (
    <p className="m-0 text-gray-600">No company administrator on file.</p>
  );

  const repContent = rep ? (
    <p className="m-0">
      <strong className="block">{formatPersonName(rep)}</strong>
      {rep.email ? (
        <a className="text-theme-primary hover:underline" href={`mailto:${rep.email}`}>
          {rep.email}
        </a>
      ) : null}
    </p>
  ) : (
    <p className="m-0 text-gray-600">No sales representative assigned.</p>
  );

  const paymentContent =
    paymentMethods.length > 0 ? (
      <ul className="m-0 p-0 list-none space-y-1">
        {paymentMethods.map((code) => (
          <li key={code}>{paymentMethodLabel(code)}</li>
        ))}
      </ul>
    ) : (
      <p className="m-0 text-gray-600">No payment methods enabled for this company.</p>
    );

  /**
   * Shipping methods come from `/api/company/advanced-settings`. Three states:
   *   1. `applicable === "selected"` → render the restricted list.
   *   2. `applicable === "all"` → group uses store-config default (no restriction).
   *   3. `applicable === null` (admin token missing / fetch failed) → neutral fallback.
   */
  const shippingMethods = shippingAdvanced?.shipping_methods ?? null;
  const shippingApplicable = shippingAdvanced?.applicable ?? null;

  const shippingContent = shippingLoading ? (
    <p className="m-0 text-gray-600">Loading shipping methods…</p>
  ) : shippingApplicable === "selected" && shippingMethods && shippingMethods.length > 0 ? (
    <ul className="m-0 p-0 list-none space-y-1">
      {shippingMethods.map((code) => (
        <li key={code}>{shippingMethodLabel(code)}</li>
      ))}
    </ul>
  ) : shippingApplicable === "all" ? (
    <p className="m-0 text-gray-600">
      All store shipping methods are available for this customer group.
    </p>
  ) : (
    <p className="m-0 text-gray-600">
      Shipping methods are configured at the store level and applied at
      checkout based on your destination.
    </p>
  );

  return (
    <div className="space-y-3">
      <AccountPageTitle />

      {/* ── Account Information (Company + Admin) ─────────────── */}
      <div className="block account-information mb-12.5">
        <div className={BLOCK_TITLE_CLASS}>Account Information</div>
        <div className="block-content flex flex-wrap lg:flex-nowrap lg:gap-10 gap-5">
          <InformationBox title="Contact Information" content={accountInfoContent} />
          <InformationBox title="Company Administrator" content={adminContent} />
        </div>
      </div>

      {/* ── Sales Representative ──────────────────────────────── */}
      <div className="block sales-representative mb-12.5">
        <div className={BLOCK_TITLE_CLASS}>Sales Representative</div>
        <div className="block-content">
          <InformationBox title="Sales Representative" content={repContent} />
        </div>
      </div>

      {/* ── Payment + Shipping ────────────────────────────────── */}
      <div className="block payment-shipping mb-12.5">
        <div className={BLOCK_TITLE_CLASS}>Payment &amp; Shipping Information</div>
        <div className="block-content flex flex-wrap lg:flex-nowrap lg:gap-10 gap-5">
          <InformationBox title="Allowed Payment Methods" content={paymentContent} />
          <InformationBox title="Allowed Shipping Methods" content={shippingContent} />
        </div>
      </div>
    </div>
  );
}
