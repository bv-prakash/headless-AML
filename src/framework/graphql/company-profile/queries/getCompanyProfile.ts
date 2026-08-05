import { gql } from "@apollo/client";
import type { CompanyProfile } from "../types";

/**
 * Magento B2B Company module — fetches the authenticated customer's
 * company profile. The root `company` query has no args; Magento
 * resolves it from the customer auth token. Returns `null` for non-B2B
 * / non-member customers.
 *
 * `company_admin` selects `id` because Apollo's cache treats `Customer`
 * as a keyed entity (`Customer.keyFields = ["id"]`) and would otherwise
 * log `Missing field 'id' while extracting keyFields`.
 */
export const GET_COMPANY_PROFILE_QUERY = gql`
  query CompanyProfile {
    company {
      id
      name
      legal_name
      email
      vat_tax_id
      reseller_id
      payment_methods
      company_admin {
        id
        firstname
        lastname
        email
      }
      sales_representative {
        firstname
        lastname
        email
      }
    }
  }
`;

export type CompanyProfileResponse = {
  readonly company: CompanyProfile | null;
};
