import { gql } from "@apollo/client";

export const CREATE_EMPTY_CART_MUTATION = gql`
  mutation CreateEmptyCart {
    createEmptyCart
  }
`;

export type CreateEmptyCartResponse = {
  createEmptyCart: string;
};
