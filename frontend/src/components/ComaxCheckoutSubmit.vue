<script setup>
import { ref } from 'vue';
import { createComaxOrder } from '../services/comaxOrders.js';

const props = defineProps({
  // Pass your checkout's cart lines: [{ sku, quantity, price, name? }]
  cart: { type: Array, required: true },
  // This should be the Comax CustomerID for the signed-in/selected customer.
  customerId: { type: String, required: true },
  // Use your app's durable order/cart ID where possible.
  orderReference: { type: String, required: true },
  customer: { type: Object, default: () => ({}) },
  remarks: { type: String, default: 'Website order' },
});

const emit = defineEmits(['created', 'error']);
const busy = ref(false);
const errorMessage = ref('');
const createdOrder = ref(null);

async function submitOrder() {
  if (busy.value || !props.cart.length) return;
  busy.value = true;
  errorMessage.value = '';
  createdOrder.value = null;

  try {
    // Prices sent from the browser are not trusted by the backend.
    // Before production, replace/augment this with your server-side
    // checkout/order lookup and validate SKU, price, discounts, stock and totals.
    const result = await createComaxOrder({
      customerId: props.customerId,
      reference: props.orderReference,
      remarks: props.remarks,
      customer: {
        name: props.customer.name ?? '',
        address: props.customer.address ?? '',
        city: props.customer.city ?? '',
        phone: props.customer.phone ?? '',
        zip: props.customer.zip ?? '',
      },
      items: props.cart.map(line => ({
        sku: String(line.sku),
        quantity: Number(line.quantity),
        price: Number(line.price),
        discountPercent: Number(line.discountPercent ?? 0),
        remarks: line.remarks ?? '',
      })),
    });

    createdOrder.value = result;
    emit('created', result);
  } catch (error) {
    errorMessage.value = error.message || 'Could not create the order.';
    emit('error', error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="comax-checkout-submit">
    <button type="button" :disabled="busy || !cart.length" @click="submitOrder">
      {{ busy ? 'Submitting order…' : 'Place order' }}
    </button>

    <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
    <p v-if="createdOrder" role="status">
      Order created. Comax document number:
      {{ createdOrder.documentNumber ?? 'not returned' }}
    </p>
  </section>
</template>
