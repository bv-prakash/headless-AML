export type CompanyAdmin = {
  readonly id: number | string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
};

export type CompanySalesRepresentative = {
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly email: string | null;
};

export type CompanyProfile = {
  readonly id: string;
  readonly name: string | null;
  readonly legal_name: string | null;
  readonly email: string | null;
  readonly vat_tax_id: string | null;
  readonly reseller_id: string | null;
  readonly payment_methods: ReadonlyArray<string> | null;
  readonly company_admin: CompanyAdmin | null;
  readonly sales_representative: CompanySalesRepresentative | null;
};

/** Response shape from `/api/company/advanced-settings`. */
export type CompanyAdvancedSettings = {
  readonly shipping_methods: ReadonlyArray<string> | null;
  readonly applicable: "all" | "selected" | null;
  readonly code?: string;
};
