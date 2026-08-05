import { gql } from "@apollo/client";

export const COUNTRY_REGIONS_QUERY = gql`
  query CountryRegions($countryId: String!) {
    country(id: $countryId) {
      id
      available_regions {
        id
        code
        name
      }
    }
  }
`;

export type DirectoryRegionNode = {
  readonly id: number;
  readonly code?: string | null;
  readonly name?: string | null;
};

export type CountryRegionsResponse = {
  country: {
    readonly id?: string | null;
    readonly available_regions?: readonly DirectoryRegionNode[] | null;
  } | null;
};
