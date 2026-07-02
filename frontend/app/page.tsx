import Header from './components/Header';
import ProductCard from './components/ProductCard';
import { fetchProducts } from './api/client';
import { Product } from './types';

export default async function Home() {
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SHO NOW</h1>
          <p className="text-xl text-gray-600">Discover amazing products at great prices</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
