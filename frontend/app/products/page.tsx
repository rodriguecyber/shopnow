import Header from '../components/Header';
import ProductsGrid from '../components/ProductsGrid';
import { fetchProducts } from '../api/client';
import { Product } from '../types';
import Link from 'next/link';

export default async function ProductsPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await fetchProducts({ next: { revalidate: 60 } });
  } catch (err) {
    console.error('Error loading products:', err);
    error = 'Failed to load products. Please try again later.';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-xl text-gray-600">Browse our complete catalog</p>
        </div>

        {error ? (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        ) : (
          <ProductsGrid products={products} />
        )}
      </main>
    </div>
  );
}
