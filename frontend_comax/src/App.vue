
<script setup>
import { reactive, ref } from 'vue'

const order = reactive({
  customerName: '',
  email: '',
  product: '',
  quantity: 1,
  notes: ''
})

const submittedOrder = ref(null)
const errorMessage = ref('')

function submitOrder() {
  errorMessage.value = ''

  if (!order.customerName.trim() || !order.email.trim() || !order.product) {
    errorMessage.value = 'Please complete all required fields.'
    return
  }

  if (!Number.isInteger(order.quantity) || order.quantity < 1) {
    errorMessage.value = 'Quantity must be at least 1.'
    return
  }

  // In a real application, send this data to your backend API.
  submittedOrder.value = { ...order }
  console.log('Order submitted:', submittedOrder.value)

  Object.assign(order, {
    customerName: '',
    email: '',
    product: '',
    quantity: 1,
    notes: ''
  })
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
                {{ submittedOrder.customerName }}!
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
                  <label for="product" class="form-label">
                    Product *
                  </label>
                  <select
                    id="product"
                    v-model="order.product"
                    class="form-select"
                    required
                  >
                    <option disabled value="">Select a product</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Keyboard">Keyboard</option>
                  </select>
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
                >
                  Submit Order
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
