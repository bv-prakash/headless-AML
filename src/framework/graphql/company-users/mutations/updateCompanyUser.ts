import { gql } from "@apollo/client";
import type { CompanyUserStatus } from "../types";
import type { CreateCompanyUserResponse } from "./createCompanyUser";

export const UPDATE_COMPANY_USER_MUTATION = gql`
  mutation UpdateCompanyUser($input: CompanyUserUpdateInput!) {
    updateCompanyUser(input: $input) {
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

export type UpdateCompanyUserInput = {
  readonly id: string;
  readonly firstname?: string;
  readonly lastname?: string;
  readonly email?: string;
  readonly job_title?: string;
  readonly telephone?: string;
  readonly role_id?: string;
  readonly status?: CompanyUserStatus;
};

export type UpdateCompanyUserResponse = CreateCompanyUserResponse;
