'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Receipt as ReceiptIcon, History, X, Printer, LogOut, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from 'next-auth/react';
import { handleLogout } from './actions';
import { printThermalReceipt } from '@/lib/printer-bluetooth';

const categories = ["All", "Tea Series", "Mojito Series", "Yakult Series", "Milk Series", "Signature Series"];

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl: string | null;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface Transaction {
    id: string;
    cashier: string;
    date: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    cash: number;
    change: number;
    paymentMethod: 'cash' | 'qris' | 'transfer';
}

export default function POSPage() {
    const { data: session, update: updateSession } = useSession();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
    const [showHistory, setShowHistory] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // Success modal
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showCart, setShowCart] = useState(false); // For mobile cart toggle
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Loading state for logout
    const [showLogoutModal, setShowLogoutModal] = useState(false); // Logout confirmation modal

    const cashierName = session?.user?.name || "Kasir";

    // Refresh session to get updated user name
    useEffect(() => {
        const refreshSession = setInterval(() => {
            updateSession();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshSession);
    }, [updateSession]);

    // Fetch products and transactions on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch products
                const productsRes = await fetch('/api/products');
                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    setProducts(productsData);
                }

                // Fetch transactions
                const transactionsRes = await fetch('/api/transactions');
                if (transactionsRes.ok) {
                    const transactionsData = await transactionsRes.json();
                    // Transform database transactions to match UI format
                    interface DbTransaction {
                        id: number;
                        createdAt: string;
                        totalAmount: number;
                        cashAmount: number | null;
                        changeAmount: number | null;
                        paymentMethod: string;
                        items: Array<{
                            productName: string;
                            quantity: number;
                            priceAtSnapshot: number;
                        }>;
                    }
                    const formattedTransactions = (transactionsData as DbTransaction[]).map((trx) => ({
                        id: `TRX-${trx.id.toString().padStart(3, '0')}`,
                        cashier: 'John Doe',
                        date: new Date(trx.createdAt).toLocaleString('id-ID'),
                        items: trx.items.map((item) => ({
                            name: item.productName || 'Unknown Product',
                            quantity: item.quantity,
                            price: item.priceAtSnapshot,
                        })),
                        total: trx.totalAmount,
                        cash: trx.cashAmount || trx.totalAmount,
                        change: trx.changeAmount || 0,
                        paymentMethod: trx.paymentMethod as 'cash' | 'qris' | 'transfer',
                    }));
                    setTransactions(formattedTransactions);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        // Auto refresh products every 10 seconds
        const intervalId = setInterval(() => {
            fetch('/api/products')
                .then(res => res.json())
                .then(data => setProducts(data))
                .catch(err => console.error('Error refreshing products:', err));
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQuantity = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const change = paymentAmount ? parseInt(paymentAmount) - totalAmount : 0;

    const handleCheckout = async () => {
        // eslint-disable-next-line react-hooks/purity
        const timestamp = Date.now();
        const transactionDate = new Date();
        
        const transaction: Transaction = {
            id: `TRX-${timestamp.toString().slice(-6)}`,
            cashier: cashierName,
            date: transactionDate.toLocaleString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            items: cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price
            })),
            total: totalAmount,
            cash: paymentMethod === 'cash' ? parseInt(paymentAmount) : totalAmount,
            change: paymentMethod === 'cash' ? change : 0,
            paymentMethod: paymentMethod
        };

        // Save to database
        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        price: item.product.price,
                    })),
                    totalAmount,
                    paymentMethod,
                    cashAmount: paymentMethod === 'cash' ? parseInt(paymentAmount) : null,
                    changeAmount: paymentMethod === 'cash' ? change : null,
                }),
            });

            if (!response.ok) {
                console.error('Failed to save transaction');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
        }

        setLastTransaction(transaction);
        // Add to transaction history
        setTransactions(prev => [transaction, ...prev]);

        // Show success modal instead of receipt
        setShowSuccess(true);

        // Clear cart and payment
        setCart([]);
        setPaymentAmount("");
    };

    const handlePrintThermal = async () => {
        if (!lastTransaction) return;

        try {
            await printThermalReceipt(lastTransaction);
            alert('✅ Struk berhasil dicetak via Bluetooth!');
        } catch (error) {
            const err = error as Error;
            console.error('Print error:', err);
            alert(`❌ Gagal mencetak: ${err.message}`);
        }
    };

    return (
        <div className="flex h-screen bg-secondary-50 overflow-hidden font-sans relative">
            {/* Left Side: Product Grid */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
                {/* Header */}
                <header className="bg-white px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-6 flex-1">
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/esteh.png" alt="Teh Barudak Indonesia" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800">Teh Barudak POS</h1>
                        </div>
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari minuman..."
                                className="pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none w-full sm:w-64 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 items-center">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Riwayat Transaksi"
                        >
                            <History size={20} />
                        </button>
                        <div className="hidden sm:block text-xs text-gray-600 px-3 py-1.5 bg-gray-100 rounded-lg">
                            Kasir: {cashierName}
                        </div>
                        <button
                            onClick={() => {
                                console.log('🔴 [CLIENT] Logout button clicked');
                                setShowLogoutModal(true);
                            }}
                            disabled={isLoggingOut}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Logout"
                        >
                            {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
                        </button>
                    </div>
                </header>

                {/* Categories */}
                <div className="px-3 sm:px-6 py-3 bg-white border-b border-gray-200">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                    "px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                                    selectedCategory === cat
                                        ? "bg-primary-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>


                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 content-start pb-24 lg:pb-6">
                    {filteredProducts.map(product => {
                        const cartItem = cart.find(item => item.product.id === product.id);
                        const quantity = cartItem ? cartItem.quantity : 0;

                        return (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl p-2 sm:p-3 border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all group"
                            >
                                <div className="aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.imageUrl || ''} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-white px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-semibold text-primary-600 shadow-sm">
                                        Rp {product.price.toLocaleString()}
                                    </div>
                                </div>
                                <h3 className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{product.name}</h3>
                                <p className="text-xs text-gray-500 hidden sm:block mb-2">{product.category}</p>
                                
                                {/* Quantity Controls */}
                                {quantity > 0 ? (
                                    <div className="flex items-center justify-between gap-1 mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(product.id, -1);
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors active:scale-95"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <div className="flex-1 text-center">
                                            <span className="font-bold text-sm sm:text-base text-gray-800">{quantity}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(product.id, 1);
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors active:scale-95"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                        }}
                                        className="w-full mt-2 py-1.5 sm:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors active:scale-95 flex items-center justify-center gap-1"
                                    >
                                        <Plus size={14} />
                                        Tambah
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>


            {/* Right Side: Cart */}
            <div className={clsx(
                "fixed lg:relative inset-0 lg:inset-auto lg:w-96 bg-white flex flex-col h-full border-l border-gray-200 z-40 transition-transform duration-300",
                showCart ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            )}>
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-primary-600" />
                        Pesanan Saat Ini
                    </h2>
                    <button
                        onClick={() => setShowCart(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingCart size={40} className="opacity-30" />
                            </div>
                            <p className="text-sm">Keranjang kosong</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex gap-2 sm:gap-3 items-center bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-md overflow-hidden shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.product.imageUrl || ''} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-sm text-gray-800 truncate">{item.product.name}</h3>
                                    <p className="text-xs text-gray-500">Rp {item.product.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product.id, -1)}
                                        className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product.id, 1)}
                                        className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-sm text-gray-800">
                                        Rp {(item.product.price * item.quantity).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payment Section */}
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">Rp {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Pajak</span>
                            <span className="font-medium">Rp 0</span>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-800">Total</span>
                            <span className="font-bold text-lg text-primary-600">Rp {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">Metode Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={clsx(
                                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                                    paymentMethod === 'cash'
                                        ? "bg-primary-500 text-white border-primary-500"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                                )}
                            >
                                💵 Tunai
                            </button>
                            <button
                                onClick={() => setPaymentMethod('qris')}
                                className={clsx(
                                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                                    paymentMethod === 'qris'
                                        ? "bg-primary-500 text-white border-primary-500"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                                )}
                            >
                                📱 QRIS
                            </button>
                            <button
                                onClick={() => setPaymentMethod('transfer')}
                                className={clsx(
                                    "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                                    paymentMethod === 'transfer'
                                        ? "bg-primary-500 text-white border-primary-500"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                                )}
                            >
                                🏦 Transfer
                            </button>
                        </div>
                    </div>

                    {/* Cash Payment Input */}
                    {paymentMethod === 'cash' && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Jumlah Uang Tunai</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Masukkan jumlah uang"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none text-sm"
                            />
                            {change > 0 && (
                                <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded-lg">
                                    <span className="text-green-700 font-medium">Kembalian</span>
                                    <span className="font-bold text-green-600">Rp {change.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QRIS Info */}
                    {paymentMethod === 'qris' && (
                        <div className="bg-blue-50 px-3 py-2 rounded-lg">
                            <p className="text-xs text-blue-700">📱 Silakan scan QRIS untuk melakukan pembayaran</p>
                        </div>
                    )}

                    {/* Transfer Info */}
                    {paymentMethod === 'transfer' && (
                        <div className="bg-purple-50 px-3 py-2 rounded-lg space-y-1">
                            <p className="text-xs text-purple-700 font-medium">🏦 Transfer ke:</p>
                            <p className="text-xs text-purple-600">BCA: 1234567890</p>
                            <p className="text-xs text-purple-600">a.n. Teh Barudak Indonesia</p>
                        </div>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={
                            cart.length === 0 ||
                            (paymentMethod === 'cash' && parseInt(paymentAmount || '0') < totalAmount)
                        }
                        className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        Checkout
                    </button>

                    {/* Logout Button - Mobile Only */}
                    <button
                        onClick={() => {
                            console.log('🔴 [CLIENT-MOBILE] Logout button clicked');
                            setShowLogoutModal(true);
                        }}
                        disabled={isLoggingOut}
                        className="lg:hidden w-full border border-red-200 text-red-600 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Logging out...
                            </>
                        ) : (
                            <>
                                <LogOut size={18} />
                                Logout
                            </>
                        )}
                    </button>
                </div>
            </div>


            {/* Success Modal */}
            {showSuccess && lastTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                        {/* Success Icon with Animation */}
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-24 h-24 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckCircle2 size={48} className="text-white" strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-gray-800">Transaksi Berhasil!</h2>
                            <p className="text-gray-600">Pembayaran telah berhasil diproses</p>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">No. Transaksi</span>
                                <span className="font-semibold text-gray-800">{lastTransaction.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Pembayaran</span>
                                <span className="font-bold text-xl text-green-600">
                                    Rp {lastTransaction.total.toLocaleString('id-ID')}
                                </span>
                            </div>
                            {lastTransaction.paymentMethod === 'cash' && (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Uang Diterima</span>
                                        <span className="font-medium">Rp {lastTransaction.cash.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Kembalian</span>
                                        <span className="font-medium text-blue-600">Rp {lastTransaction.change.toLocaleString('id-ID')}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Metode Pembayaran</span>
                                <span className="font-medium">
                                    {lastTransaction.paymentMethod === 'cash' && '💵 Tunai'}
                                    {lastTransaction.paymentMethod === 'qris' && '📱 QRIS'}
                                    {lastTransaction.paymentMethod === 'transfer' && '🏦 Transfer'}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Print Button */}
                            <button
                                onClick={async () => {
                                    try {
                                        await printThermalReceipt(lastTransaction);
                                        alert('✅ Struk berhasil dicetak via Bluetooth!');
                                    } catch (error) {
                                        const err = error as Error;
                                        alert(`❌ Gagal mencetak: ${err.message}`);
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={20} />
                                Print Struk
                            </button>

                            {/* Share to WhatsApp Button */}
                            <button
                                onClick={() => {
                                    const message = `*STRUK PEMBAYARAN*\n*TEH BARUDAK INDONESIA*\n\nNo. Transaksi: ${lastTransaction.id}\nTanggal: ${lastTransaction.date}\nKasir: ${lastTransaction.cashier}\n\n*PESANAN:*\n${lastTransaction.items.map(item => `${item.quantity}x ${item.name} - Rp ${(item.quantity * item.price).toLocaleString('id-ID')}`).join('\n')}\n\n*TOTAL: Rp ${lastTransaction.total.toLocaleString('id-ID')}*\nMetode: ${lastTransaction.paymentMethod === 'cash' ? 'Tunai' : lastTransaction.paymentMethod === 'qris' ? 'QRIS' : 'Transfer'}${lastTransaction.paymentMethod === 'cash' ? `\nTunai: Rp ${lastTransaction.cash.toLocaleString('id-ID')}\nKembalian: Rp ${lastTransaction.change.toLocaleString('id-ID')}` : ''}\n\nTerima kasih telah berbelanja!`;
                                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                    window.open(whatsappUrl, '_blank');
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Share2 size={20} />
                                Share ke WhatsApp
                            </button>

                            {/* Back Button */}
                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setLastTransaction(null);
                                }}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Kembali
                            </button>
                        </div>

                        {/* Thank You Message */}
                        <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
                            <p>Terima kasih telah berbelanja! 🎉</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && lastTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Struk Pembayaran</h2>
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Receipt Details */}
                            <div className="text-center space-y-1">
                                <h3 className="font-bold text-xl">TEH BARUDAK INDONESIA</h3>
                                <p className="text-sm text-gray-600">Jl. Raya Kauman Kudu No.19</p>
                                <p className="text-sm text-gray-600">Genuk, Semarang 50113</p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tanggal:</span>
                                    <span className="font-medium">{lastTransaction.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Kasir:</span>
                                    <span className="font-medium">{lastTransaction.cashier}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">No. Transaksi:</span>
                                    <span className="font-medium">{lastTransaction.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Metode Bayar:</span>
                                    <span className="font-medium">
                                        {lastTransaction.paymentMethod === 'cash' && '💵 Tunai'}
                                        {lastTransaction.paymentMethod === 'qris' && '📱 QRIS'}
                                        {lastTransaction.paymentMethod === 'transfer' && '🏦 Transfer'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                {lastTransaction.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{item.name}</p>
                                            <p className="text-gray-500 text-xs">
                                                {item.quantity} x Rp {item.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="font-medium">
                                            Rp {(item.quantity * item.price).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total:</span>
                                    <span className="text-primary-600">Rp {lastTransaction.total.toLocaleString()}</span>
                                </div>
                                {lastTransaction.paymentMethod === 'cash' && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tunai:</span>
                                            <span className="font-medium">Rp {lastTransaction.cash.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Kembalian:</span>
                                            <span className="font-medium text-green-600">Rp {lastTransaction.change.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
                                <p>Terima kasih atas kunjungan Anda!</p>
                                <p>Follow us @tehbarudak.id</p>
                            </div>

                            <button
                                onClick={handlePrintThermal}
                                className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={20} />
                                Cetak Struk Thermal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Riwayat Transaksi</h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {transactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <History size={48} className="opacity-30 mb-3" />
                                    <p className="text-sm">Belum ada transaksi</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((trx) => (
                                        <div key={trx.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-gray-800">{trx.id}</p>
                                                    <p className="text-xs text-gray-500">{trx.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary-600">Rp {trx.total.toLocaleString()}</p>
                                                    <p className="text-xs text-gray-600">
                                                        {trx.paymentMethod === 'cash' && '💵 Tunai'}
                                                        {trx.paymentMethod === 'qris' && '📱 QRIS'}
                                                        {trx.paymentMethod === 'transfer' && '🏦 Transfer'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1 mb-3">
                                                {trx.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm text-gray-600">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span>Rp {(item.quantity * item.price).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Action Buttons */}
                                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                                                <button
                                                    onClick={() => {
                                                        setLastTransaction(trx);
                                                        setShowHistory(false);
                                                        setShowReceipt(true);
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-primary-500 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <ReceiptIcon size={16} />
                                                    Lihat Struk
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await printThermalReceipt(trx);
                                                            alert('✅ Struk berhasil dicetak!');
                                                        } catch (error) {
                                                            const err = error as Error;
                                                            alert(`❌ Gagal mencetak: ${err.message}`);
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Printer size={16} />
                                                    Print
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Cart Button for Mobile/Tablet */}
            <button
                onClick={() => setShowCart(true)}
                className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-primary-600 active:scale-95 transition-all"
            >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                )}
            </button>

            {/* Overlay for mobile cart */}
            {showCart && (
                <div
                    onClick={() => setShowCart(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                />
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto">
                            <LogOut size={32} className="text-red-600" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-800">Konfirmasi Logout</h3>
                            <p className="text-gray-600">
                                Apakah Anda yakin ingin keluar dari sistem?
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    console.log('❌ [MODAL] User clicked Cancel');
                                    setShowLogoutModal(false);
                                }}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                onClick={async () => {
                                    console.log('✅ [MODAL] User clicked Logout');
                                    console.log('⏳ [MODAL] Setting loading state...');
                                    setIsLoggingOut(true);
                                    console.log('📞 [MODAL] Calling handleLogout()...');
                                    try {
                                        await handleLogout();
                                        console.log('✅ [MODAL] handleLogout() completed');
                                    } catch (error) {
                                        const err = error as Error;
                                        console.log('🔄 [MODAL] Caught error:', err?.message || error);
                                        // NEXT_REDIRECT is expected, let it propagate
                                        if (err?.message?.includes('NEXT_REDIRECT')) {
                                            console.log('✅ [MODAL] NEXT_REDIRECT detected - this is normal!');
                                            throw error;
                                        }
                                        console.error('❌ [MODAL] Unexpected error:', error);
                                        setIsLoggingOut(false);
                                        setShowLogoutModal(false);
                                    }
                                }}
                                disabled={isLoggingOut}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Logging out...
                                    </>
                                ) : (
                                    'Ya, Logout'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
