import "dotenv/config";
import { db } from "@/db";
import { users, products } from "@/db/schema";
import bcrypt from "bcryptjs";
import { exit } from "process";

async function seed() {
    console.log("Seeding database...");

    // Create Users
    const adminPassword = await bcrypt.hash("admin123", 10);
    const cashierPassword = await bcrypt.hash("cashier123", 10);

    await db.insert(users).values([
        {
            username: "admin",
            name: "Administrator",
            passwordHash: adminPassword,
            role: "admin",
        },
        {
            username: "kasir1",
            name: "Kasir Satu",
            passwordHash: cashierPassword,
            role: "cashier",
        },
    ]).onConflictDoNothing();

    // Create Products - Based on Real Menu Teh Barudak
    await db.insert(products).values([
        // --- Tea Series ---
        { name: "Jasmine Tea", price: 3000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
        { name: "Lemon Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400" },
        { name: "Lychee Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
        { name: "Apple Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400" },
        { name: "Mango Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400" },
        { name: "Passion Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1624286432522-440463f6d6a3?w=400" },
        { name: "Grape Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1599819177331-838f48680298?w=400" },
        { name: "Vanilla Tea", price: 5000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400" },
        { name: "Milk Tea", price: 8000, category: "Tea Series", imageUrl: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400" },

        // --- Mojito Series ---
        { name: "Mojito Mangga", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400" },
        { name: "Mojito Lychee", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
        { name: "Mojito Melon", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400" },
        { name: "Mojito Strawberry", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400" },
        { name: "Mojito Orange", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400" },
        { name: "Mojito Blackcurrant", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400" },
        { name: "Mojito Bubblegum", price: 8000, category: "Mojito Series", imageUrl: "https://images.unsplash.com/photo-1604882355734-d2447ff10b59?w=400" },

        // --- Yakult Series ---
        { name: "Yakult Mango", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" },
        { name: "Yakult Melon", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400" },
        { name: "Yakult Lychee", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
        { name: "Yakult Orange", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400" },
        { name: "Yakult Strawberry", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400" },
        { name: "Yakult Lemon", price: 8000, category: "Yakult Series", imageUrl: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400" },

        // --- Milk Series ---
        { name: "Milk Strawberry", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
        { name: "Milk Silverqueen", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400" },
        { name: "Milk Redvelvet", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
        { name: "Milk Hazelnut", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
        { name: "Milk Matcha", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400" },
        { name: "Milk Taro", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=400" },
        { name: "Thai Tea", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
        { name: "Milk Tiramisu", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" },
        { name: "Milk Bubblegum", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1604882355734-d2447ff10b59?w=400" },
        { name: "Milk Coklat", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
        { name: "Milk Coklat Oreo", price: 10000, category: "Milk Series", imageUrl: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400" },

        // --- Signature Series ---
        { name: "Signature Strawberry", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
        { name: "Signature Silverqueen", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" },
        { name: "Signature Redvelvet", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400" },
        { name: "Signature Hazelnut", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
        { name: "Signature Matcha", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1536013432465-7e4a2a2eac98?w=400" },
        { name: "Signature Taro", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1623428187969-5da29b20fe9e?w=400" },
        { name: "Signature Thai Tea", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
        { name: "Signature Tiramisu", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" },
        { name: "Signature Bubblegum", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1604882355734-d2447ff10b59?w=400" },
        { name: "Signature Coklat", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
        { name: "Signature Coklat Oreo", price: 12000, category: "Signature Series", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
    ]).onConflictDoNothing();

    console.log("Seeding complete!");
    exit(0);
}

seed();
