'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, X, Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl: string | null;
    isActive: boolean;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        imageUrl: '',
        isActive: true
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['Tea Series', 'Mojito Series', 'Yakult Series', 'Milk Series', 'Signature Series'];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products?all=true');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const productData = {
            name: formData.name,
            price: parseInt(formData.price),
            category: formData.category,
            imageUrl: formData.imageUrl || null,
            isActive: formData.isActive
        };

        try {
            let response;
            if (editingProduct) {
                // Update existing product
                console.log('Updating product:', editingProduct.id, productData);
                response = await fetch(`/api/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                // Create new product
                console.log('Creating new product:', productData);
                response = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                console.log('Product saved successfully:', result);
                alert(editingProduct ? 'Produk berhasil diupdate!' : 'Produk berhasil ditambahkan!');
                await fetchProducts(); // Refresh the list
                closeModal();
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                alert(`Gagal menyimpan produk: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Gagal menyimpan produk! Periksa koneksi Anda.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

        try {
            console.log('Deleting product:', id);
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('Product deleted successfully');
                alert('Produk berhasil dihapus!');
                await fetchProducts(); // Refresh the list
            } else {
                const error = await response.json();
                console.error('Error response:', error);
                alert(`Gagal menghapus produk: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Gagal menghapus produk! Periksa koneksi Anda.');
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price.toString(),
                category: product.category,
                imageUrl: product.imageUrl || '',
                isActive: product.isActive
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                category: categories[0],
                imageUrl: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            price: '',
            category: '',
            imageUrl: '',
            isActive: true
        });
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle image upload to Cloudinary
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Hanya file gambar yang diperbolehkan!');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB!');
            return;
        }

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const result = await response.json();
                setFormData({ ...formData, imageUrl: result.url });
                alert('Gambar berhasil diupload!');
            } else {
                const error = await response.json();
                alert(`Gagal upload gambar: ${error.error}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal upload gambar!');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Manajemen Produk</h1>
                    <p className="text-secondary-500">Kelola produk minuman Teh Barudak</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    className="pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-secondary-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">Produk</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">Kategori</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">Harga</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada produk ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-secondary-25">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                                    {product.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                // Hide broken image and show placeholder
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <span className={clsx(
                                                        "text-primary-600 font-bold text-lg",
                                                        product.imageUrl ? "hidden" : ""
                                                    )}>
                                                        {product.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-secondary-900">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-secondary-600">{product.category}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-secondary-900">
                                                Rp {product.price.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-full text-xs font-medium",
                                                product.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-700"
                                            )}>
                                                {product.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(product)}
                                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Produk *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                                    placeholder="e.g. Jasmine Tea"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Harga *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                                    placeholder="5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kategori *
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                                >
                                    <option value="">Pilih kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gambar Produk
                                </label>
                                
                                {/* Image Preview */}
                                {formData.imageUrl && (
                                    <div className="mb-3 relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Upload Button */}
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Upload Gambar
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Manual URL Input */}
                                <div className="mt-3">
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Atau masukkan URL gambar:
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none text-sm"
                                        placeholder="https://res.cloudinary.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Produk Aktif
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                                >
                                    {editingProduct ? 'Update' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
