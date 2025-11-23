// ESC/POS Commands for Thermal Printer
// ESC and GS commands are used inline with hex codes

export interface Transaction {
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

/**
 * Format text to fit thermal printer width (32 characters)
 */
function padLine(left: string, right: string, width: number = 32): string {
    const padding = width - left.length - right.length;
    return left + ' '.repeat(Math.max(0, padding)) + right;
}

/**
 * Build ESC/POS receipt data
 */
function buildReceiptData(transaction: Transaction): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Helper to add string
    const addText = (text: string) => {
        const bytes = encoder.encode(text);
        commands.push(...Array.from(bytes));
    };

    // Helper to add command
    const addCommand = (...bytes: number[]) => {
        commands.push(...bytes);
    };

    // Initialize printer
    addCommand(0x1B, 0x40); // ESC @

    // ===== HEADER =====
    // Center align
    addCommand(0x1B, 0x61, 0x01); // ESC a 1
    
    // Bold + Large text
    addCommand(0x1B, 0x45, 0x01); // ESC E 1 (Bold ON)
    addCommand(0x1D, 0x21, 0x11); // GS ! 17 (Double size)
    addText('TEH BARUDAK INDONESIA\n');
    addCommand(0x1B, 0x45, 0x00); // ESC E 0 (Bold OFF)
    addCommand(0x1D, 0x21, 0x00); // GS ! 0 (Normal size)
    
    addText('Jl. Raya Kauman Kudu No.19\n');
    addText('Genuk, Semarang 50113\n\n');

    // Left align
    addCommand(0x1B, 0x61, 0x00); // ESC a 0

    // ===== TRANSACTION INFO =====
    addText('================================\n');
    addText(`Date    : ${transaction.date}\n`);
    addText(`Cashier : ${transaction.cashier}\n`);
    addText(`Trx ID  : ${transaction.id}\n`);
    addText('================================\n\n');

    // ===== ITEMS =====
    transaction.items.forEach(item => {
        // Item name
        addText(`${item.name}\n`);
        
        // Quantity x Price = Subtotal
        const qtyPrice = `  ${item.quantity} x ${item.price.toLocaleString('id-ID')}`;
        const subtotal = (item.quantity * item.price).toLocaleString('id-ID');
        addText(padLine(qtyPrice, subtotal, 32) + '\n');
    });

    addText('================================\n');

    // ===== TOTALS =====
    // Bold for totals
    addCommand(0x1B, 0x45, 0x01); // ESC E 1 (Bold ON)
    
    const totalLine = padLine('TOTAL', `Rp ${transaction.total.toLocaleString('id-ID')}`, 32);
    addText(totalLine + '\n');

    // Payment method
    const paymentLabel = transaction.paymentMethod === 'cash' ? 'TUNAI' :
                        transaction.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER';
    const paymentLine = padLine('PAYMENT', paymentLabel, 32);
    addText(paymentLine + '\n');

    // Cash and change (only for cash payments)
    if (transaction.paymentMethod === 'cash') {
        const cashLine = padLine('CASH', `Rp ${transaction.cash.toLocaleString('id-ID')}`, 32);
        addText(cashLine + '\n');
        
        const changeLine = padLine('CHANGE', `Rp ${transaction.change.toLocaleString('id-ID')}`, 32);
        addText(changeLine + '\n');
    }
    
    addCommand(0x1B, 0x45, 0x00); // ESC E 0 (Bold OFF)

    addText('================================\n\n');

    // ===== FOOTER =====
    // Center align
    addCommand(0x1B, 0x61, 0x01); // ESC a 1
    
    addText('Thank you for your order!\n');
    addText('Follow us @tehbarudak.id\n\n');
    addText('Wifi: TehBarudak_Free\n');
    addText('Pass: barudak123\n\n\n');

    // Cut paper (partial cut)
    addCommand(0x1D, 0x56, 0x01); // GS V 1

    // Feed and cut
    addText('\n\n\n');

    return new Uint8Array(commands);
}

/**
 * Print receipt via Bluetooth thermal printer
 */
export async function printThermalReceipt(transaction: Transaction): Promise<void> {
    try {
        // Check if Web Bluetooth API is available
        if (!('bluetooth' in navigator)) {
            throw new Error('Web Bluetooth API tidak tersedia di browser ini. Gunakan Chrome atau Edge.');
        }

        console.log('🔍 Mencari printer Bluetooth...');

        // Request Bluetooth device
        // Common thermal printer service UUIDs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const device = await (navigator as any).bluetooth.requestDevice({
            // Accept all devices and let user choose
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb', // Generic thermal printer
                '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some thermal printers
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Generic printer service
            ]
        });

        console.log('✅ Printer ditemukan:', device.name);
        console.log('🔌 Menghubungkan ke printer...');

        // Connect to GATT server
        const server = await device.gatt?.connect();
        if (!server) {
            throw new Error('Gagal terhubung ke printer');
        }

        console.log('✅ Terhubung ke printer');
        console.log('🔍 Mencari service...');

        // Try to get the primary service
        let service;
        let characteristic;

        // Try different service UUIDs
        const serviceUUIDs = [
            '000018f0-0000-1000-8000-00805f9b34fb',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455',
            'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        ];

        const characteristicUUIDs = [
            '00002af1-0000-1000-8000-00805f9b34fb',
            '49535343-8841-43f4-a8d4-ecbe34729bb3',
            'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        ];

        // Try to find working service and characteristic
        for (const serviceUUID of serviceUUIDs) {
            try {
                service = await server.getPrimaryService(serviceUUID);
                console.log('✅ Service ditemukan:', serviceUUID);

                for (const charUUID of characteristicUUIDs) {
                    try {
                        characteristic = await service.getCharacteristic(charUUID);
                        console.log('✅ Characteristic ditemukan:', charUUID);
                        break;
                    } catch {
                        continue;
                    }
                }

                if (characteristic) break;
            } catch {
                continue;
            }
        }

        if (!characteristic) {
            throw new Error('Tidak dapat menemukan characteristic printer yang kompatibel');
        }

        console.log('📄 Membangun data struk...');

        // Build receipt data
        const receiptData = buildReceiptData(transaction);

        console.log('🖨️ Mengirim data ke printer...');

        // Send data in chunks (some printers have buffer limits)
        const chunkSize = 512; // Send 512 bytes at a time
        for (let i = 0; i < receiptData.length; i += chunkSize) {
            const chunk = receiptData.slice(i, Math.min(i + chunkSize, receiptData.length));
            await characteristic.writeValue(chunk);
            
            // Small delay between chunks
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log('✅ Struk berhasil dicetak!');

        // Disconnect after printing
        setTimeout(() => {
            device.gatt?.disconnect();
            console.log('🔌 Terputus dari printer');
        }, 1000);

    } catch (error) {
        console.error('❌ Error saat mencetak:', error);
        const err = error as Error;
        
        if (err.name === 'NotFoundError') {
            throw new Error('Tidak ada printer yang dipilih');
        } else if (err.name === 'SecurityError') {
            throw new Error('Akses Bluetooth ditolak. Pastikan menggunakan HTTPS.');
        } else if (err.message?.includes('Bluetooth')) {
            throw new Error('Web Bluetooth tidak tersedia. Gunakan Chrome atau Edge di desktop.');
        } else {
            throw new Error(`Gagal mencetak: ${err.message}`);
        }
    }
}
