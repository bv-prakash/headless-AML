export type NavigationItem = {
  readonly id: number;
  readonly name: string;
  readonly url_path: string | null;
  readonly children?: readonly NavigationItem[];
};

export type CategoryNavigationMenuProps = {
  items: readonly NavigationItem[];
};
