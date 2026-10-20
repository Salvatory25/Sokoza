import React, { useEffect, useState, useCallback } from 'react';
import { fetchCategories, saveCategory, deleteCategory } from '../../lib/api';
import { Category } from '../../types/database';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameSw, setNameSw] = useState('');
  const [slug, setSlug] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setNameEn('');
    setNameSw('');
    setSlug('');
    setImagePath('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80');
    setSortOrder((categories.length + 1).toString());
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameEn(cat.name_en);
    setNameSw(cat.name_sw);
    setSlug(cat.slug);
    setImagePath(cat.image_path || '');
    setSortOrder(cat.sort_order.toString());
    setIsActive(cat.is_active);
    setIsModalOpen(true);
  };

  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!editingCategory) {
      // Auto-generate slug
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameSw.trim() || !slug.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveCategory({
        id: editingCategory?.id,
        name_en: nameEn.trim(),
        name_sw: nameSw.trim(),
        slug: slug.trim(),
        image_path: imagePath.trim() || null,
        sort_order: parseInt(sortOrder, 10) || 1,
        is_active: isActive,
      });

      showToast(`Category "${saved.name_en}" saved successfully`, 'success');
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await saveCategory({
        ...cat,
        is_active: !cat.is_active,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
      showToast(`Category marked as ${!cat.is_active ? 'active' : 'inactive'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      showToast(`Deleted category "${categoryToDelete.name_en}"`, 'info');
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Category Manager
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Manage marketplace departments, multilingual labels (English & Swahili), and banner visuals.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-soft-sm"
        >
          Add New Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-surface-border shadow-soft-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400 space-y-3">
            <Layers className="w-8 h-8 text-charcoal-300 mx-auto" />
            <p>No categories defined yet.</p>
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              Create First Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-charcoal-600 font-bold uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Swahili Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-subtle/50 transition">
                    <td className="py-3 px-4 font-bold text-charcoal-500">
                      <span className="w-6 h-6 rounded-lg bg-surface-subtle inline-flex items-center justify-center border text-[11px]">
                        {cat.sort_order}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {cat.image_path ? (
                          <img
                            src={cat.image_path}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-surface-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center text-charcoal-400 border shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-charcoal-900 block">{cat.name_en}</span>
                          {cat.product_count !== undefined && (
                            <span className="text-[10px] text-charcoal-400">
                              {cat.product_count} products
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-charcoal-700">{cat.name_sw}</td>

                    <td className="py-3 px-4 font-mono text-charcoal-500 text-[11px]">{cat.slug}</td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-800 hover:bg-surface-subtle transition"
                          title="Edit Category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-left text-xs">
          <Input
            label="Category Name (English)"
            placeholder="e.g. Beauty & Cosmetics"
            value={nameEn}
            onChange={(e) => handleNameEnChange(e.target.value)}
            required
          />

          <Input
            label="Category Name (Swahili)"
            placeholder="e.g. Urembo na Vipodozi"
            value={nameSw}
            onChange={(e) => setNameSw(e.target.value)}
            required
          />

          <Input
            label="URL Slug"
            placeholder="e.g. beauty-cosmetics"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />

          <Input
            label="Banner / Photo URL"
            placeholder="https://images.unsplash.com/..."
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              min="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                Status
              </label>
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-charcoal-800">Active in Storefront</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Delete Category"
      >
        <div className="space-y-4 text-xs text-charcoal-600">
          <p>
            Are you sure you want to delete the category{' '}
            <strong className="text-charcoal-900">{categoryToDelete?.name_en}</strong>? Products currently in this category will remain, but will no longer be listed under this section.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setCategoryToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Yes, Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
