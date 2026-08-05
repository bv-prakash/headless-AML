export type OrderMoney = {
  readonly value: number;
  readonly currency: string;
};

export type OrderAddress = {
  readonly firstname?: string | null;
  readonly lastname?: string | null;
  readonly company?: string | null;
  readonly street?: readonly string[] | null;
  readonly city?: string | null;
  readonly region?: string | null;
  readonly postcode?: string | null;
  readonly country_code?: string | null;
  readonly telephone?: string | null;
};

export type CustomerOrderListItem = {
  readonly id: string;
  readonly number: string;
  readonly increment_id?: string | null;
  readonly order_date: string;
  readonly status: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type CustomerDashboardRecentOrderItem = CustomerOrderListItem & {
  readonly billing_address?: OrderAddress | null;
};

export type CustomerOrdersData = {
  readonly customer?: {
    readonly id?: string | number | null;
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly total_count?: number | null;
      readonly items: readonly CustomerOrderListItem[];
    } | null;
  } | null;
};

export type CustomerOrdersVariables = {
  readonly currentPage: number;
  readonly pageSize: number;
};

export type CustomerDashboardRecentOrdersData = {
  readonly customer?: {
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly items: readonly CustomerDashboardRecentOrderItem[];
    } | null;
  } | null;
};

export type CustomerOrderLineItem = {
  readonly id: string;
  readonly product_name?: string | null;
  readonly product_sku: string;
  readonly product_url_key?: string | null;
  readonly quantity_ordered?: number | null;
  readonly product_sale_price?: OrderMoney | null;
};

export type CustomerOrderInvoice = {
  readonly id: string;
  readonly number: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type CustomerOrderShipmentTracking = {
  readonly title: string;
  readonly carrier: string;
  readonly number?: string | null;
};

export type CustomerOrderShipmentItem = {
  readonly id: string;
  readonly product_name?: string | null;
  readonly product_sku: string;
  readonly quantity_shipped?: number | null;
};

export type CustomerOrderShipment = {
  readonly id: string;
  readonly number: string;
  readonly tracking?: readonly CustomerOrderShipmentTracking[] | null;
  readonly items?: readonly CustomerOrderShipmentItem[] | null;
};

export type CustomerOrderCreditMemo = {
  readonly id: string;
  readonly number: string;
  readonly total?: {
    readonly grand_total?: OrderMoney | null;
  } | null;
};

export type OrderPaymentMethodRow = {
  readonly name?: string | null;
  readonly type?: string | null;
};

export type CustomerOrderDetail = CustomerOrderListItem & {
  readonly shipping_method?: string | null;
  readonly carrier?: string | null;
  readonly payment_methods?: readonly OrderPaymentMethodRow[] | null;
  readonly total?: {
    /** Deprecated in Magento GraphQL docs but widely available (replaces
     *  `subtotal_excl_tax` on older APIs). */
    readonly subtotal?: OrderMoney | null;
    readonly total_tax?: OrderMoney | null;
    readonly total_shipping?: OrderMoney | null;
    readonly grand_total?: OrderMoney | null;
  } | null;
  readonly billing_address?: OrderAddress | null;
  readonly shipping_address?: OrderAddress | null;
  readonly items?: readonly CustomerOrderLineItem[] | null;
  readonly invoices?: readonly CustomerOrderInvoice[] | null;
  readonly shipments?: readonly CustomerOrderShipment[] | null;
  readonly credit_memos?: readonly CustomerOrderCreditMemo[] | null;
};

export type CustomerOrderDetailData = {
  readonly customer?: {
    readonly firstname?: string | null;
    readonly lastname?: string | null;
    readonly orders?: {
      readonly items: readonly CustomerOrderDetail[];
    } | null;
  } | null;
};

export type CustomerOrderDetailVariables = {
  readonly orderNumber: string;
};
