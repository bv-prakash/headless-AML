export type AddressFormState = {
  firstname: string;
  lastname: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  /** State/province label (or free text when country has no directory regions). */
  region: string;
  postcode: string;
  country_code: string;
  telephone: string;
};

export function emptyAddress(): AddressFormState {
  return {
    firstname: "",
    lastname: "",
    company: "",
    street1: "",
    street2: "",
    city: "",
    region: "",
    postcode: "",
    country_code: "US",
    telephone: "",
  };
}
