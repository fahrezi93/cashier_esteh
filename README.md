# 🧋 Teh Barudak Indonesia - Point of Sale System

Modern, responsive Point of Sale (POS) system built with Next.js 16, TypeScript, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green)

## ✨ Features

### 🛒 POS (Point of Sale)
- **Product Management**: Browse and search products by category
- **Shopping Cart**: Add/remove items with quantity control
- **Multiple Payment Methods**: Cash, QRIS, Bank Transfer
- **Transaction Success Modal**: Beautiful success confirmation
- **Receipt Generation**: View and print receipts
- **Transaction History**: View all past transactions

### 👨‍💼 Admin Dashboard
- **Dashboard Overview**: Sales statistics and charts
- **Product Management**: CRUD operations for products
- **Sales Reports**: Daily, weekly, and monthly reports
- **PDF Export**: Download reports as PDF
- **User Management**: Manage staff accounts

### 🔐 Authentication
- **Secure Login**: NextAuth v5 with credentials
- **Role-based Access**: Admin and Cashier roles
- **Session Management**: Persistent sessions
- **Custom Logout Modal**: Beautiful logout confirmation

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth v5
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Charts**: Recharts

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/KreativLabs-id/esteh_cashier.git
cd esteh_cashier
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Copy env.example.txt to .env
cp env.example.txt .env

# Edit .env with your values
DATABASE_URL=your_neon_database_url
AUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

4. **Push database schema**
```bash
npx drizzle-kit push
```

5. **Seed database**
```bash
npm run db:reset
```

6. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials

### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full admin dashboard

### Cashier
- **Username**: `kasir1`
- **Password**: `cashier123`
- **Access**: POS system only

⚠️ **Change these credentials in production!**

## 📁 Project Structure

```
esteh_cashier/
├── app/
│   ├── admin/          # Admin dashboard pages
│   │   ├── dashboard/  # Dashboard overview
│   │   ├── products/   # Product management
│   │   ├── reports/    # Sales reports
│   │   └── users/      # User management
│   ├── api/            # API routes
│   │   ├── auth/       # NextAuth endpoints
│   │   ├── products/   # Product CRUD
│   │   ├── reports/    # Report data
│   │   └── transactions/ # Transaction CRUD
│   ├── login/          # Login page
│   ├── pos/            # POS system
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
│   ├── pos/           # POS-specific components
│   └── providers/     # Context providers
├── db/                # Database configuration
│   ├── schema.ts      # Drizzle schema
│   └── index.ts       # Database client
├── scripts/           # Utility scripts
│   ├── seed.ts        # Database seeding
│   └── reset-seed.ts  # Reset & seed
└── public/            # Static assets
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:seed      # Seed database
npm run db:reset     # Reset & seed database

# Code Quality
npm run lint         # Run ESLint
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KreativLabs-id/esteh_cashier)

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your deployment URL

## 📸 Screenshots

### POS System
- Modern product grid with categories
- Real-time cart management
- Multiple payment methods
- Success modal with transaction summary

### Admin Dashboard
- Sales overview with charts
- Product management interface
- Comprehensive reports
- PDF export functionality

## 🔒 Security

- ✅ Environment variables for sensitive data
- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ Role-based access control
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ CSRF protection (NextAuth)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **KreativLabs** - [GitHub](https://github.com/KreativLabs-id)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting
- Neon for PostgreSQL database
- All open-source contributors

---

**Made with ❤️ by KreativLabs**
