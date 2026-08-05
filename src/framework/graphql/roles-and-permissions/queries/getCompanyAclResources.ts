import { gql } from "@apollo/client";
import type { CompanyAclResourceNode } from "@/src/framework/graphql/roles-and-permissions/types";

/**
 * Master tree of every grantable ACL resource, used to render the
 * add/edit form's permission tree. Five levels deep covers every
 * resource Magento ships today.
 */
export const GET_COMPANY_ACL_RESOURCES_QUERY = gql`
  query CompanyAclResources {
    company {
      id
      acl_resources {
        id
        text
        sort_order
        children {
          id
          text
          sort_order
          children {
            id
            text
            sort_order
            children {
              id
              text
              sort_order
              children {
                id
                text
                sort_order
              }
            }
          }
        }
      }
    }
  }
`;

export type GetCompanyAclResourcesResponse = {
  readonly company: {
    readonly id: string;
    readonly acl_resources: ReadonlyArray<CompanyAclResourceNode> | null;
  } | null;
};
