export type AddressFormState = {
  firstname: string;
  lastname: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  region: string;
  regionId: string;
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
    regionId: "",
    postcode: "",
    country_code: "US",
    telephone: "",
  };
}
