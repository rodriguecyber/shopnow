import Link from 'next/link';
import Header from '../../components/Header';
import { fetchOrderById } from '../../api/client';

interface Order {
  id: string;
  user_id: string;
  email: string;
  name: string;
  total_price: number;
  status: string;
  created_at: string;
  items?: any[];
}

interface OrderPageProps {
  params: {
    id: string;
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  let order: Order | null = null;
  let error: string | null = null;

  try {
    order = await fetchOrderById(params.id, { next: { revalidate: 60 } });
  } catch (err) {
    console.error('Error loading order:', err);
    error = 'Failed to load order details.';
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-8">{error || 'Order not found.'}</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
            <p className="text-gray-600">Thank you for your purchase!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-gray-900">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-gray-900 capitalize">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {order.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900">{order.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{order.email}</p>
                </div>
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-3 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total Amount</span>
              <span>${(order.total_price * 1.08).toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-500">Includes 8% tax</p>
          </div>

          <div className="mt-8 pt-8 border-t">
            <p className="text-gray-600 mb-4">We've sent a confirmation email to {order.email}</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
