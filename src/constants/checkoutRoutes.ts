/** Path for post–place-order redirect. Query: `orderNumber` (Magento `placeOrder.orderV2.number`). */
export const CHECKOUT_SUCCESS_PATH = "/checkout/success";

export const ORDER_NUMBER_QUERY_PARAM = "orderNumber";

export function checkoutSuccessHref(orderNumber: string): string {
  const params = new URLSearchParams({
    [ORDER_NUMBER_QUERY_PARAM]: orderNumber,
  });
  return `${CHECKOUT_SUCCESS_PATH}?${params.toString()}`;
}
