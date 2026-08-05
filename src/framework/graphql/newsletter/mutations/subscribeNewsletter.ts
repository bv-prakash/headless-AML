import { gql } from "@apollo/client";

export const NEWSLETTER_SUBSCRIBE_MUTATION = gql`
  mutation SubscribeNewsletter($email: String!) {
    subscribeEmailToNewsletter(email: $email) {
      status
    }
  }
`;

export type NewsletterSubscribeVariables = {
  readonly email: string;
};

export type NewsletterSubscribeResponse = {
  subscribeEmailToNewsletter: {
    status: string;
  } | null;
};
