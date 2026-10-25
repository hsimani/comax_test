const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Create an order through your Node.js backend.
 * Never call Comax directly from Vue: credentials belong on the server.
 */
export async function createComaxOrder(order) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    const error = new Error(data.error ?? data.errors?.map(e => e.message).join(', ') ?? 'Order creation failed');
    error.status = response.status;
    error.details = data.details ?? data.errors ?? [];
    throw error;
  }
  return data;
}
