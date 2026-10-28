const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function createComaxOrder(order) {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    const error = new Error(
      data.error ?? data.errors?.map(item => item.message).join(', ') ?? 'Order creation failed',
    )
    error.status = response.status
    error.details = data.details ?? data.errors ?? []
    throw error
  }

  return data
}
