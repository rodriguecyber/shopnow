const API_URL =
  typeof window === 'undefined'
    ? process.env.API_URL || 'http://localhost:5000/api'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


// ── Logger ──────────────────────────────────────────────────────────────────
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    }));
  },
};

//  Types 
type ApiFetchOptions = RequestInit & {
  next?: {
    revalidate?: number | boolean;
  };
};

//  Core fetch wrapper 
const apiFetch = async (
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<Response> => {
  const method = options.method ?? 'GET';
  const url = `${API_URL}${endpoint}`;
  const startTime = performance.now();

  logger.info('API request started', { method, url });

  try {
    const response = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      logger.error('API request failed', {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration_ms: duration,
      });
    } else {
      logger.info('API request succeeded', {
        method,
        url,
        status: response.status,
        duration_ms: duration,
      });
    }

    return response;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error('API request threw an exception', {
      method,
      url,
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

//  Products API 
export const fetchProducts = async (fetchOptions: ApiFetchOptions = {}) => {
  const response = await apiFetch('/products', fetchOptions);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const fetchProductById = async (id: string, fetchOptions: ApiFetchOptions = {}) => {
  const response = await apiFetch(`/products/${id}`, fetchOptions);
  if (!response.ok) throw new Error('Failed to fetch product');
  return response.json();
};

export const createProduct = async (product: unknown) => {
  const response = await apiFetch('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};

export const updateProduct = async (id: string, product: unknown) => {
  const response = await apiFetch(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
};

export const deleteProduct = async (id: string) => {
  const response = await apiFetch(`/products/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete product');
  return response.json();
};

//  Orders API 
export const createOrder = async (orderData: unknown) => {
  const response = await apiFetch('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) throw new Error('Failed to create order');
  return response.json();
};

export const fetchOrders = async (fetchOptions: ApiFetchOptions = {}) => {
  const response = await apiFetch('/orders', fetchOptions);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const fetchOrderById = async (id: string, fetchOptions: ApiFetchOptions = {}) => {
  const response = await apiFetch(`/orders/${id}`, fetchOptions);
  if (!response.ok) throw new Error('Failed to fetch order');
  return response.json();
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await apiFetch(`/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update order status');
  return response.json();
};