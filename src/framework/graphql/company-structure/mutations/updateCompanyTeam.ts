import { gql } from "@apollo/client";
import type { CreateCompanyTeamResponse } from "./createCompanyTeam";

export const UPDATE_COMPANY_TEAM_MUTATION = gql`
  mutation UpdateCompanyTeam($input: CompanyTeamUpdateInput!) {
    updateCompanyTeam(input: $input) {
      team {
        id
        name
        description
      }
    }
  }
`;

export type UpdateCompanyTeamInput = {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
};

export type UpdateCompanyTeamResponse = CreateCompanyTeamResponse;
