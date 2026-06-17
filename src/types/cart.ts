export interface CartItem {
  cartKey: string;
  productId: string;
  variationId?: string;
  name: string;
  slug: string;
  pricePaise: number;
  gstRateBps: number;
  image?: string;
  quantity: number;
  sku: string;
  variationLabel?: string;
}

export function cartItemKey(productId: string, variationId?: string) {
  return variationId ? `${productId}:${variationId}` : productId;
}
