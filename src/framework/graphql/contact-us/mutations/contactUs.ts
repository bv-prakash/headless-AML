import { gql } from "@apollo/client";

/** Storefront contact form (Adobe Commerce `contactUs` mutation). */
export const CONTACT_US_MUTATION = gql`
  mutation ContactUsHeadless($input: ContactUsInput!) {
    contactUs(input: $input) {
      status
    }
  }
`;

export type ContactUsInput = {
  readonly name: string;
  readonly email: string;
  readonly telephone?: string;
  readonly comment: string;
};

export type ContactUsVariables = {
  readonly input: ContactUsInput;
};

export type ContactUsResponse = {
  readonly contactUs?: {
    readonly status?: boolean | null;
  } | null;
};
