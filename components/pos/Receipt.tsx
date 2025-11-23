import React from 'react';

interface ReceiptProps {
    transaction: {
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
    };
}

export const Receipt = ({ transaction }: ReceiptProps) => {
    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return 'TUNAI';
            case 'qris': return 'QRIS';
            case 'transfer': return 'TRANSFER';
            default: return 'TUNAI';
        }
    };

    return (
        <div id="printable-receipt" className="hidden print:block w-[58mm] p-2 font-mono text-[10px] leading-tight text-black bg-white absolute top-0 left-0 z-9999">
            <div className="text-center mb-4">
                <h1 className="font-bold text-sm uppercase">Teh Barudak Indonesia</h1>
                <p>Jl. Raya Kauman Kudu No.19</p>
                <p>Genuk, Semarang 50113</p>
            </div>

            <div className="mb-2 border-b border-dashed border-black pb-2 space-y-1">
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{transaction.date}</span>
                </div>
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{transaction.cashier}</span>
                </div>
                <div className="flex justify-between">
                    <span>Trx ID:</span>
                    <span>{transaction.id}</span>
                </div>
            </div>

            <div className="space-y-1 mb-2 border-b border-dashed border-black pb-2">
                {transaction.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                        <span>{item.name}</span>
                        <div className="flex justify-between pl-2">
                            <span>{item.quantity} x {item.price.toLocaleString()}</span>
                            <span>{(item.quantity * item.price).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-1 mb-4 font-bold border-b border-dashed border-black pb-2">
                <div className="flex justify-between text-xs">
                    <span>TOTAL</span>
                    <span>Rp {transaction.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>PAYMENT</span>
                    <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                </div>
                {transaction.paymentMethod === 'cash' && (
                    <>
                        <div className="flex justify-between">
                            <span>CASH</span>
                            <span>Rp {transaction.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CHANGE</span>
                            <span>Rp {transaction.change.toLocaleString()}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="text-center space-y-1">
                <p>Thank you for your order!</p>
                <p>Follow us @tehbarudak.id</p>
                <p>Wifi: TehBarudak_Free / Pass: barudak123</p>
            </div>
        </div>
    );
};
