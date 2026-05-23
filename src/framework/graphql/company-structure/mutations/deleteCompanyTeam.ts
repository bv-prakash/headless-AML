import { gql } from "@apollo/client";

export const DELETE_COMPANY_TEAM_MUTATION = gql`
  mutation DeleteCompanyTeam($id: ID!) {
    deleteCompanyTeam(id: $id) {
      success
    }
  }
`;

export type DeleteCompanyTeamResponse = {
  readonly deleteCompanyTeam: { readonly success: boolean } | null;
};
