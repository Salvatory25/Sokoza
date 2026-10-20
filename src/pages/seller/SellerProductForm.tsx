import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchCategories, saveProduct, fetchProducts } from '../../lib/api';
import { Category } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ImageUpload } from '../../components/ui/ImageUpload';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const SellerProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const shop = user?.shop;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceTzs, setPriceTzs] = useState('');
  const [comparePriceTzs, setComparePriceTzs] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [sku, setSku] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  // Images state
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Variants state (e.g. Size / Color)
  const [variants, setVariants] = useState<
    Array<{ id: string; name: string; value: string; price_adjustment_tzs: number; stock_quantity: number }>
  >([]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const cats = await fetchCategories();
        setCategories(cats);
        setCategoryId((prev) => prev || (cats.length > 0 ? cats[0].id : ''));

        if (isEditing && shop) {
          const prods = await fetchProducts({ shopId: shop.id });
          const target = prods.find((p) => p.id === id);
          if (target) {
            setName(target.name);
            setSlug(target.slug);
            setDescription(target.description);
            setCategoryId(target.category_id);
            setPriceTzs(target.price_tzs.toString());
            setComparePriceTzs(target.compare_at_price_tzs ? target.compare_at_price_tzs.toString() : '');
            setStockQuantity(target.stock_quantity.toString());
            setSku(target.sku || '');
            setStatus(target.status as any);
            if (target.images && target.images.length > 0) {
              setImages(target.images.map((i) => i.storage_path));
            }
            if (target.variants) {
              setVariants(target.variants as any);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init product form:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [id, isEditing, shop]);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}`,
        name: 'Size',
        value: 'Standard',
        price_adjustment_tzs: 0,
        stock_quantity: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shop) {
      showToast('You must have an active shop to publish products', 'error');
      return;
    }

    if (!name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    const price = parseInt(priceTzs, 10);
    if (isNaN(price) || price < 0) {
      showToast('Please enter a valid price in TZS', 'error');
      return;
    }

    const stock = parseInt(stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      showToast('Please enter a valid stock quantity', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const generatedSlug =
        slug.trim() ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      await saveProduct({
        id: isEditing ? id : undefined,
        shop_id: shop.id,
        category_id: categoryId,
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim(),
        price_tzs: price,
        compare_at_price_tzs: comparePriceTzs ? parseInt(comparePriceTzs, 10) : null,
        stock_quantity: stock,
        sku: sku.trim() || null,
        status,
        images: images.map((url, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          product_id: id || '',
          storage_path: url,
          alt_text: name,
          sort_order: idx,
        })),
        variants: variants.map((v) => ({
          ...v,
          product_id: id || '',
        })),
      });

      showToast(`Product ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
      navigate('/seller/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto" />
        <p className="text-xs text-charcoal-500 font-medium">Loading product form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-8">
      {/* Back button & Title */}
      <div>
        <Link
          to="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-600 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product List</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Publish products in Tanzanian Shillings (TZS) for direct WhatsApp orders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details Box */}
        <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
            General Information
          </h2>

          <Input
            label="Product Title"
            placeholder="e.g. Cotton Wax Kitenge or Anker Fast-Charge Power Bank"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!isEditing && (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                );
              }
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Product Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name_en }))}
              required
            />

            <Input
              label="SKU / Stock ID (Optional)"
              placeholder="e.g. EL-ANK-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
              Full Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe materials, size dimensions, warranty, and special packaging..."
              className="w-full rounded-xl border border-surface-border p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
            Pricing & Inventory (TZS)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Price (TZS)"
              type="number"
              placeholder="45000"
              value={priceTzs}
              onChange={(e) => setPriceTzs(e.target.value)}
              required
            />

            <Input
              label="Original / Compare Price (TZS)"
              type="number"
              placeholder="55000"
              value={comparePriceTzs}
              onChange={(e) => setComparePriceTzs(e.target.value)}
              hint="Shows discount badge if higher than price"
            />

            <Input
              label="Units in Stock"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
            Product Photos
          </h2>

          {/* Firebase Storage Image Upload */}
          <ImageUpload
            folder="products"
            onImageUploaded={(url) => setImages((prev) => [...prev, url])}
          />

          {/* Image Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden border border-surface-border bg-surface-subtle group"
              >
                <img src={imgUrl} alt="Product preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white shadow-soft-sm opacity-0 group-hover:opacity-100 transition"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Variants (Optional) */}
        <div className="bg-white rounded-3xl border border-surface-border p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Options & Variations
              </h2>
              <p className="text-xs text-charcoal-400">e.g. Sizes, Colors, or Fabric Lengths</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Option
            </Button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-2">
              No variants defined. The product uses a single standard price and stock.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-surface-subtle p-3 rounded-2xl border"
                >
                  <input
                    type="text"
                    placeholder="Option (e.g. Size)"
                    value={v.name}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].name = e.target.value;
                      setVariants(updated);
                    }}
                    className="text-xs p-2 rounded-lg border bg-white"
                  />

                  <input
                    type="text"
                    placeholder="Value (e.g. XL or Blue)"
                    value={v.value}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].value = e.target.value;
                      setVariants(updated);
                    }}
                    className="text-xs p-2 rounded-lg border bg-white"
                  />

                  <input
                    type="number"
                    placeholder="Price + (TZS)"
                    value={v.price_adjustment_tzs}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].price_adjustment_tzs = parseInt(e.target.value, 10) || 0;
                      setVariants(updated);
                    }}
                    className="text-xs p-2 rounded-lg border bg-white"
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={v.stock_quantity}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].stock_quantity = parseInt(e.target.value, 10) || 0;
                        setVariants(updated);
                      }}
                      className="text-xs p-2 rounded-lg border bg-white flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publication Status & Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={status === 'published'}
                onChange={() => setStatus('published')}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span>Published (Visible to Customers)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-700 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={status === 'draft'}
                onChange={() => setStatus('draft')}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span>Draft (Hidden)</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            {isEditing ? 'Save Changes' : 'Publish Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};
