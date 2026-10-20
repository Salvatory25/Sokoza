import { Product, ProductVariant, Shop } from './database';

export interface CartItem {
  id: string; // unique item id: productId or productId_variantId
  productId: string;
  product: Product;
  shop: Shop;
  selectedVariant?: ProductVariant;
  quantity: number;
  unitPriceTzs: number;
  addedAt: number;
}

export interface SellerCartGroup {
  shopId: string;
  shop: Shop;
  items: CartItem[];
  subtotalTzs: number;
  itemCount: number;
}

export interface CartState {
  items: CartItem[];
  totalItemCount: number;
  totalAmountTzs: number;
}
