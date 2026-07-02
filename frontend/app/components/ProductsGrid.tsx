'use client';

import { useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface ProductsGridProps {
  products: Product[];
}

export default function ProductsGrid({ products }: ProductsGridProps) {
  const [filter, setFilter] = useState('all');

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const filteredProducts =
    filter === 'all' ? products : products.filter((product) => product.category === filter);

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
