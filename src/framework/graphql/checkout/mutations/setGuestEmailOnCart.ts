import { gql } from "@apollo/client";

export const SET_GUEST_EMAIL_ON_CART = gql`
  mutation SetGuestEmailOnCart($cartId: String!, $email: String!) {
    setGuestEmailOnCart(input: { cart_id: $cartId, email: $email }) {
      cart {
        email
      }
    }
  }
`;

export type SetGuestEmailVariables = {
  readonly cartId: string;
  readonly email: string;
};

export type SetGuestEmailResponse = {
  setGuestEmailOnCart: {
    cart: { email?: string | null };
  };
};
