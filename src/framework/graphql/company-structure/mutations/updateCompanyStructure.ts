import { gql } from "@apollo/client";

/**
 * Re-parents an existing structure node — used when implementing
 * drag-and-drop reorganisation of the tree. The current UI doesn't
 * expose drag, but the mutation is wired up so a future iteration can
 * call it without touching the GraphQL layer.
 */
export const UPDATE_COMPANY_STRUCTURE_MUTATION = gql`
  mutation UpdateCompanyStructure($input: CompanyStructureUpdateInput!) {
    updateCompanyStructure(input: $input) {
      company {
        id
        structure {
          items {
            id
            parent_id
          }
        }
      }
    }
  }
`;

export type UpdateCompanyStructureInput = {
  readonly tree_id: string;
  readonly parent_tree_id: string;
};
