export type User = {
  id: string;
  name: string;
  email: string;
};

export type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
};

export type CheckoutFormProps = {
  clientSecret: string;
  cartItems: CartItem[];
  coupon?: Coupon | null;
  sessionId: string | null;
  user: User | null;
  address: Address | null;
};

export type Coupon = {
  code: string;
  discountAmount: number;
};

export type CartItem = {
  id: string;
  title: string;
  quantity: number;
  salePrice: number;
};
