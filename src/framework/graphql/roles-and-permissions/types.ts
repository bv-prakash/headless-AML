/**
 * Shared TypeScript types for the Roles & Permissions GraphQL surface.
 *
 * Both `Company.acl_resources` (master tree of every grantable resource)
 * and `CompanyRole.permissions` (the granted subset for one role) are
 * returned as nested trees with the same node shape. They're typed
 * separately because Magento's schema names them differently
 * (`CompanyAclResource` vs the role-permission nodes), and because
 * `role.permissions` semantically represents an *explicit grant per
 * node* — including parents.
 */

export type CompanyAclResourceNode = {
  readonly id: string | null;
  readonly text: string | null;
  readonly sort_order?: number | null;
  readonly children?: ReadonlyArray<CompanyAclResourceNode> | null;
};

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
