
<script setup>
import { reactive, ref } from 'vue'
import { createComaxOrder } from './services/comaxOrders.js'

const order = reactive({
  customerName: '',
  email: '',
  customerId: '',
  product: '',
  price: '',
  quantity: 1,
  notes: ''
})

const submittedOrder = ref(null)
const errorMessage = ref('')
const isSubmitting = ref(false)
const orderReference = ref('')

async function submitOrder() {
  if (isSubmitting.value) return

  errorMessage.value = ''
  submittedOrder.value = null
  isSubmitting.value = true
  orderReference.value ||= `WEB-${Date.now()}`

  try {
    const result = await createComaxOrder({
      customerId: order.customerId.trim(),
      reference: orderReference.value,
      remarks: order.notes,
      customer: {
        name: order.customerName.trim(),
      },
      delivery: {
        email: order.email.trim(),
      },
      items: [{
        sku: order.product.trim(),
        quantity: order.quantity,
        price: order.price,
      }],
    })

    submittedOrder.value = {
      customerName: order.customerName,
      documentNumber: result.documentNumber,
    }
    orderReference.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Could not create the order.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-vh-100 bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">

          <div class="card shadow-sm border-0">
            <div class="card-body p-4 p-md-5">
              <h1 class="h3 mb-2">Place an Order</h1>
              <p class="text-secondary mb-4">
                Fill in the details below to submit your order.
              </p>

              <div
                v-if="submittedOrder"
                class="alert alert-success"
                role="status"
              >
                Order submitted successfully for
                {{ submittedOrder.customerName }}.
                Comax document number: {{ submittedOrder.documentNumber ?? 'not returned' }}.
              </div>

              <div
                v-if="errorMessage"
                class="alert alert-danger"
                role="alert"
              >
                {{ errorMessage }}
              </div>

              <form @submit.prevent="submitOrder">
                <div class="mb-3">
                  <label for="customerName" class="form-label">
                    Customer name *
                  </label>
                  <input
                    id="customerName"
                    v-model="order.customerName"
                    type="text"
                    class="form-control"
                    autocomplete="name"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">
                    Email address *
                  </label>
                  <input
                    id="email"
                    v-model="order.email"
                    type="email"
                    class="form-control"
                    autocomplete="email"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="customerId" class="form-label">
                    Comax customer ID *
                  </label>
                  <input
                    id="customerId"
                    v-model="order.customerId"
                    type="text"
                    class="form-control"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="product" class="form-label">
                    Comax item ID *
                  </label>
                  <input
                    id="product"
                    v-model="order.product"
                    type="text"
                    class="form-control"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="price" class="form-label">
                    Unit price *
                  </label>
                  <input
                    id="price"
                    v-model.number="order.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-control"
                    required
                  />
                </div>

                <div class="mb-3">
                  <label for="quantity" class="form-label">
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    v-model.number="order.quantity"
                    type="number"
                    min="1"
                    step="1"
                    class="form-control"
                    required
                  />
                </div>

                <div class="mb-4">
                  <label for="notes" class="form-label">
                    Additional notes
                  </label>
                  <textarea
                    id="notes"
                    v-model="order.notes"
                    class="form-control"
                    rows="3"
                    placeholder="Optional order instructions"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-100"
                  :disabled="isSubmitting"
                >
                  {{ isSubmitting ? 'Submitting order…' : 'Submit Order' }}
                </button>
              </form>
            </div>
          </div>

          <p class="text-center text-secondary small mt-3">
            Fields marked with * are required.
          </p>

        </div>
      </div>
    </div>
  </div>
</template>
