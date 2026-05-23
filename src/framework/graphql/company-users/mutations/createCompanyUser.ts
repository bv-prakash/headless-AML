import { gql } from "@apollo/client";
import type { CompanyUserStatus } from "../types";

export const CREATE_COMPANY_USER_MUTATION = gql`
  mutation CreateCompanyUser($input: CompanyUserCreateInput!) {
    createCompanyUser(input: $input) {
      user {
        id
        firstname
        lastname
        email
        job_title
        telephone
      }
    }
  }
`;

export type CreateCompanyUserInput = {
  readonly firstname: string;
  readonly lastname: string;
  readonly email: string;
  readonly job_title: string;
  readonly telephone: string;
  readonly role_id: string;
  readonly status: CompanyUserStatus;
  /** Parent team id; defaults to company root when omitted. */
  readonly target_id?: string;
};

export type CreateCompanyUserResponse = {
  readonly createCompanyUser: {
    readonly user: {
      readonly id: number | string;
      readonly firstname: string | null;
      readonly lastname: string | null;
      readonly email: string | null;
      readonly job_title: string | null;
      readonly telephone: string | null;
    } | null;
  } | null;
};
