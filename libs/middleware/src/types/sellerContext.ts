export type SellerContext = {
  id: string;
  email: string;
  name: string;
  phone_number: string;
  country_code: string;
  stripeId?: string | null;
};
