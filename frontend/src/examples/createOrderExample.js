import { createComaxOrder } from '../services/comaxOrders.js';

// Call this from your Vue component after the user confirms the checkout.
export async function submitExampleOrder() {
  return createComaxOrder({
    customerId: 'YOUR_COMAX_CUSTOMER_ID',
    reference: `WEB-${Date.now()}`, // Prefer a durable unique order ID from your own database.
    remarks: 'Website order',
    customer: {
      name: 'Example Customer',
      phone: '0500000000',
    },
    delivery: {
      address: 'Example Street',
      addressNumber: '1',
      city: 'Tel Aviv',
    },
    items: [
      {
        sku: 'YOUR_COMAX_ITEM_ID',
        quantity: 2,
        price: 19.9,
        discountPercent: 0,
        remarks: '',
      },
    ],
  });
}
