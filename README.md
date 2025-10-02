# DesignXcel

A modern furniture e-commerce platform built with React and Node.js, featuring 3D model viewing, comprehensive admin management, and seamless payment integration.

## 🚀 Features

- **Modern Furniture Catalog** - Browse furniture with 3D model viewing capabilities
- **User Authentication** - Secure login and profile management
- **Shopping Cart & Wishlist** - Full e-commerce functionality
- **Order Management** - Complete order processing and tracking
- **Admin Dashboard** - Comprehensive CMS for product and content management
- **Payment Integration** - Stripe payment processing
- **Review System** - Customer reviews and testimonials
- **Gallery Management** - Image and media management
- **Responsive Design** - Mobile-first, modern UI/UX
- **Address Book** - Multiple shipping addresses
- **Discount System** - Product discounts and promotions
- **Hero Banner Management** - Dynamic homepage banners

## 🛠️ Tech Stack

- **Frontend**: React, JavaScript, CSS3, HTML5
- **Backend**: Node.js, Express.js
- **Database**: SQL Server
- **Payment**: Stripe integration
- **File Upload**: Multer
- **Authentication**: JWT
- **3D Models**: GLB/GLTF support
- **Styling**: Custom CSS with modern design principles

## 📁 Project Structure

```
DesignXcel/
├── frontend/          # React frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── build/        # Production build
├── backend/           # Node.js/Express backend API
│   ├── routes/       # API routes
│   ├── views/        # EJS templates
│   ├── uploads/      # File uploads
│   └── scripts/      # Utility scripts
├── database-schemas/  # SQL database schemas and migrations
├── docs/             # Comprehensive project documentation
├── client/           # Additional client-side code
└── .env.example      # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js (>=16.0.0)
- npm (>=8.0.0)
- SQL Server
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EugenioPantua19/DesignXcel.git
   cd DesignXcel
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API configuration
   ```

4. **Set up the database:**
   - Install SQL Server
   - Run the SQL scripts in `database-schemas/` folder
   - Configure database connection in `.env`

5. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start both frontend (React) and backend (Node.js) servers concurrently.

### Alternative Start Methods

- **Backend only:** `npm run start:backend`
- **Frontend only:** `npm run start:frontend`
- **Production build:** `npm run build`

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
- [API Documentation](docs/)
- [Database Setup](docs/)
- [Payment Integration](docs/STRIPE_SETUP.md)
- [Admin Features](docs/)

## 🔧 Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm run install:all` - Install dependencies for all parts of the project
- `npm run clean` - Clean all node_modules and build files
- `npm test` - Run frontend tests
- `npm run lint` - Run linting

## 🌟 Key Features Implementation

### E-commerce Functionality
- Product catalog with variants and pricing
- Shopping cart with persistent storage
- Order management and tracking
- Payment processing with Stripe
- User authentication and profiles

### Admin Dashboard
- Product management with image uploads
- Order processing and status updates
- Content management (banners, testimonials)
- User management
- Analytics and reporting

### 3D Model Integration
- GLB/GLTF model support
- Interactive 3D product viewing
- Model optimization and loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **DesignXcel Team** - *Initial work* - [EugenioPantua19](https://github.com/EugenioPantua19)

## 🙏 Acknowledgments

- React community for excellent documentation
- Express.js team for the robust backend framework
- Stripe for seamless payment integration
- All contributors and testers

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
2. Search existing [Issues](https://github.com/EugenioPantua19/DesignXcel/issues)
3. Create a new issue with detailed information

## 🔗 Links

- **Repository**: [https://github.com/EugenioPantua19/DesignXcel](https://github.com/EugenioPantua19/DesignXcel)
- **Issues**: [https://github.com/EugenioPantua19/DesignXcel/issues](https://github.com/EugenioPantua19/DesignXcel/issues)
- **Documentation**: [https://github.com/EugenioPantua19/DesignXcel/tree/main/docs](https://github.com/EugenioPantua19/DesignXcel/tree/main/docs)

---

⭐ **Star this repository if you found it helpful!**
