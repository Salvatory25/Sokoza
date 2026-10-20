import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchProducts, deleteProduct } from '../../lib/api';
import { Product } from '../../types/database';
import { formatTZS } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Package,
} from 'lucide-react';

export const SellerProducts: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const shop = user?.shop;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    if (!shop) return;
    setIsLoading(true);
    try {
      const prods = await fetchProducts({ shopId: shop.id });
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      showToast(`Deleted "${productToDelete.name}"`, 'info');
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Product Management</h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage your inventory, prices in TZS, and active listings.
          </p>
        </div>

        <Link to="/seller/products/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Add New Product
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search your products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-surface-border shadow-soft-sm focus:ring-1 focus:ring-brand-500"
        />
        <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400 space-y-3">
            <Package className="w-8 h-8 text-charcoal-300 mx-auto" />
            <p>No products found in your shop inventory.</p>
            <Link to="/seller/products/new">
              <Button variant="outline" size="sm">Create First Product</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-charcoal-600 font-bold uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price (TZS)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((prod) => {
                  const img =
                    prod.images && prod.images.length > 0
                      ? prod.images[0].storage_path
                      : 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80';

                  return (
                    <tr key={prod.id} className="hover:bg-surface-subtle/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-surface-border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-charcoal-900 block truncate max-w-xs">
                              {prod.name}
                            </span>
                            {prod.variants && prod.variants.length > 0 && (
                              <span className="text-[10px] text-brand-600 font-medium">
                                {prod.variants.length} options
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-charcoal-900">
                        {formatTZS(prod.price_tzs)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md ${
                            prod.stock_quantity <= 0
                              ? 'bg-red-50 text-red-700'
                              : prod.stock_quantity < 5
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {prod.stock_quantity} in stock
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            prod.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-charcoal-100 text-charcoal-600'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/product/${prod.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Preview product"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/seller/products/edit/${prod.id}`}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-800 hover:bg-charcoal-100 transition"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-xs text-charcoal-600">
            Are you sure you want to permanently delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setProductToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Yes, Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
