'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../components/Header';
import { useCart } from '../cart-context';
import { createOrder } from '../api/client';

export default function Cart() {
  const { state, dispatch } = useCart();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', productId });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
    }
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const items = state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const order = await createOrder({ email, name, items });
      
      setSuccess(true);
      dispatch({ type: 'CLEAR_CART' });
      
      // Redirect to order confirmation
      setTimeout(() => {
        window.location.href = `/orders/${order.id}`;
      }, 2000);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-8">Redirecting to order confirmation...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {state.items.map((item) => (
              <div key={item.product.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      unoptimized
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                    <p className="text-gray-600">${item.product.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${state.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(state.total * 0.08).toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-xl font-semibold">
                  <span>Total</span>
                  <span>${(state.total * 1.08).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}