import { gql } from "@apollo/client";

export const CREATE_COMPANY_TEAM_MUTATION = gql`
  mutation CreateCompanyTeam($input: CompanyTeamCreateInput!) {
    createCompanyTeam(input: $input) {
      team {
        id
        name
        description
      }
    }
  }
`;

export type CreateCompanyTeamInput = {
  readonly name: string;
  readonly description?: string;
  /**
   * Parent structure node id (Magento `target_id`). When omitted,
   * Magento attaches the new team directly under the company root.
   */
  readonly target_id?: string;
};

export type CreateCompanyTeamResponse = {
  readonly createCompanyTeam: {
    readonly team: {
      readonly id: string;
      readonly name: string | null;
      readonly description: string | null;
    } | null;
  } | null;
};
