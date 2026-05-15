import { gql } from "@apollo/client";

/**
 * Queries for the **Roles and Permissions** page.
 *
 *  - `COMPANY_ROLES_QUERY` powers the list page (paginated; includes
 *    `permissions { id }` so the "duplicate" action can clone without a
 *    second round-trip).
 *  - `COMPANY_ACL_RESOURCES_QUERY` returns the permission tree shown in the
 *    add/edit form. The query queries up to 5 nesting levels which covers
 *    every resource Magento ships today.
 *  - `COMPANY_ROLE_DETAIL_QUERY` fetches a single role for the edit form's
 *    name + checked-permissions prefill.
 */

export type CompanyAclResourceNode = {
  readonly id: string | null;
  readonly text: string | null;
  readonly sort_order?: number | null;
  readonly children?: ReadonlyArray<CompanyAclResourceNode> | null;
};

/**
 * Magento returns `role.permissions` as a **nested tree** mirroring the
 * granted branches of the ACL — not a flat list. Each granted leaf is
 * reached by walking through its ancestor nodes. Querying only the
 * top-level `id`s would lose the actual leaf grants, so this type and
 * its corresponding query include the same 4-deep nesting Magento's
 * own admin UI uses.
 */
export type CompanyRolePermission = {
  readonly id: string | null;
  readonly text?: string | null;
  readonly sort_order?: number | null;
  readonly children?: ReadonlyArray<CompanyRolePermission> | null;
};

export type CompanyRoleListItem = {
  readonly id: string;
  readonly name: string;
  readonly users_count: number | null;
  readonly permissions: ReadonlyArray<CompanyRolePermission> | null;
};

export type CompanyRolesVariables = {
  readonly currentPage?: number;
  readonly pageSize?: number;
};

export type CompanyRolesResponse = {
  readonly company: {
    readonly id: string;
    readonly roles: {
      readonly total_count: number;
      readonly items: ReadonlyArray<CompanyRoleListItem>;
      readonly page_info: {
        readonly current_page: number;
        readonly page_size: number;
        readonly total_pages: number;
      };
    } | null;
  } | null;
};

export type CompanyAclResourcesResponse = {
  readonly company: {
    readonly id: string;
    readonly acl_resources: ReadonlyArray<CompanyAclResourceNode> | null;
  } | null;
};

export type CompanyRoleDetailResponse = {
  readonly company: {
    readonly id: string;
    readonly role: CompanyRoleListItem | null;
  } | null;
};

export const COMPANY_ROLES_QUERY = gql`
  query CompanyRoles($currentPage: Int = 1, $pageSize: Int = 20) {
    company {
      id
      roles(currentPage: $currentPage, pageSize: $pageSize) {
        total_count
        items {
          id
          name
          users_count
          permissions {
            id
            children {
              id
              children {
                id
                children {
                  id
                }
              }
            }
          }
        }
        page_info {
          current_page
          page_size
          total_pages
        }
      }
    }
  }
`;

export const COMPANY_ACL_RESOURCES_QUERY = gql`
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

export const COMPANY_ROLE_DETAIL_QUERY = gql`
  query CompanyRoleDetail($id: ID!) {
    company {
      id
      role(id: $id) {
        id
        name
        users_count
        permissions {
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

/** Flatten the tree to the list of ids — useful for "select all"
 *  computations and indeterminate-state detection. */
export function collectAllAclIds(
  resources: ReadonlyArray<CompanyAclResourceNode>,
): ReadonlyArray<string> {
  const out: string[] = [];
  const walk = (list: ReadonlyArray<CompanyAclResourceNode>) => {
    for (const n of list) {
      if (n.id) out.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(resources);
  return out;
}

/** Ids in the subtree rooted at `node` (including the node itself). */
export function collectSubtreeIds(
  node: CompanyAclResourceNode,
): ReadonlyArray<string> {
  const out: string[] = [];
  const walk = (n: CompanyAclResourceNode) => {
    if (n.id) out.push(n.id);
    if (n.children?.length) {
      for (const c of n.children) walk(c);
    }
  };
  walk(node);
  return out;
}

/**
 * Collect **every** id from the role's nested permission tree — both
 * leaves and interior nodes.
 *
 * Magento returns `role.permissions` as a nested tree whose nodes are
 * the actually-granted ACL resource codes. Interior nodes are not
 * "scaffolding": they're themselves explicit grants. The matching
 * `CompanyRoleCreateInput.permissions` field is a flat list that
 * includes both parent codes (e.g. `Magento_Company::user_management`)
 * and child codes (e.g. `Magento_Company::roles_view`) side-by-side,
 * so we have to project the returned tree back to that same flat set.
 *
 * Earlier versions collected only leaves, which made every granted
 * parent render as unchecked even when the user had ticked the entire
 * subtree.
 */
export function collectGrantedPermissionIds(
  permissions: ReadonlyArray<CompanyRolePermission> | null | undefined,
): string[] {
  if (!permissions?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (n: CompanyRolePermission) => {
    if (n.id && !seen.has(n.id)) {
      seen.add(n.id);
      out.push(n.id);
    }
    if (n.children?.length) {
      for (const c of n.children) walk(c);
    }
  };
  for (const p of permissions) walk(p);
  return out;
}
