# 📚 Booklet - MERN Stack E-commerce Application

![Booklet Logo](https://via.placeholder.com/800x200/F97316/FFFFFF?text=Booklet+-+Your+Online+Bookstore)

## 🌟 Overview

**Booklet** is a modern, full-stack e-commerce web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) specifically designed for selling books online. The application features a beautiful, responsive design with Tailwind CSS and provides a complete shopping experience for both customers and administrators.

## ✨ Key Features

### 👥 **User Features**
- 🔐 **User Authentication** - Secure registration and login system
- 📖 **Product Browsing** - Browse books by categories with beautiful card layouts
- 🔍 **Search Functionality** - Find books by name or description
- 🛒 **Shopping Cart** - Add, remove, and manage cart items with persistence
- 📦 **Order Management** - Place orders and track order status
- 👤 **Profile Management** - Update personal information and view order history
- 📱 **Responsive Design** - Optimized for all device sizes

### 🔧 **Admin Features**
- 📊 **Admin Dashboard** - Comprehensive overview with analytics
- 📚 **Product Management** - Create, read, update, delete products with image upload
- 🏷️ **Category Management** - Organize products into categories
- 📋 **Order Tracking** - View and update order statuses
- 👥 **User Management** - View all registered users and their information
- 🖼️ **Image Upload** - Secure file upload for product images

### 🛠️ **Technical Features**
- 🔒 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Role-based Authorization** - Admin and customer role separation
- 🌐 **RESTful API** - Clean, well-structured API endpoints
- 💾 **MongoDB Integration** - Flexible NoSQL database with Mongoose ODM
- 📱 **Mobile-First Design** - Responsive UI with Tailwind CSS
- ⚡ **Performance Optimized** - Lazy loading, memoization, efficient queries
- 🎨 **Modern UI/UX** - Beautiful design with smooth animations and transitions

## 🏗️ Technology Stack

### **Frontend**
- **React.js 18** - Modern UI library with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Beautiful icon library
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - Elegant notifications
- **Moment.js** - Date formatting

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local installation or cloud)
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/booklet.git
   cd booklet
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment setup**
   ```bash
   # Create .env file in root directory
   touch .env
   ```
   
   Add the following environment variables:
   ```env
   PORT=8080
   DEV_MODE=development
   MONGO_URL=mongodb://localhost:27017/bookbuddy
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Start the application**
   ```bash
   # Run both frontend and backend concurrently
   npm run dev
   
   # Or run separately:
   npm run server  # Backend only (port 8080)
   npm run client  # Frontend only (port 3000)
   ```

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080

## 🐳 Docker (No Compose)

Run backend and frontend in separate containers using Node 23.

### Backend container

```bash
docker build -f backend/Dockerfile -t booklet-backend .
docker run -d \
  --name booklet-backend \
  --env-file backend/.env \
  -e FRONTEND_URL=http://localhost:3000 \
  -p 8080:8080 \
  booklet-backend
```

### Frontend container

```bash
docker build -f frontend/Dockerfile -t booklet-frontend ./frontend
docker run -d \
  --name booklet-frontend \
  -e REACT_APP_API_URL=http://localhost:8080 \
  -p 3000:3000 \
  booklet-frontend
```

### Stop and remove containers

```bash
docker stop booklet-frontend booklet-backend
docker rm booklet-frontend booklet-backend
```

## 📱 Screenshots

### Homepage
![Homepage](https://via.placeholder.com/800x400/F3F4F6/374151?text=Beautiful+Homepage+with+Product+Grid)

### Product Details
![Product Details](https://via.placeholder.com/800x400/EEF2FF/4F46E5?text=Product+Details+Page)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400/F0FDF4/059669?text=Admin+Dashboard+with+Analytics)

### Mobile Responsive
![Mobile View](https://via.placeholder.com/400x600/FEF3C7/D97706?text=Mobile+Responsive+Design)

## 🎨 Design System

- **Primary Color**: Indigo (#4F46E5)
- **Typography**: Playfair Display for headings, Inter for body text
- **Spacing**: 8px grid system
- **Shadows**: Subtle elevation with multiple shadow levels
- **Animations**: Smooth transitions and hover effects

## 📁 Project Structure

```
BookStore/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middlewares
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # Reusable components
│       ├── context/     # React context providers
│       ├── hooks/       # Custom hooks
│       ├── pages/       # Page components
│       └── config/      # Configuration files
└── package.json         # Root package file
```

## 🔐 Authentication & Security

- **JWT Tokens** - Secure authentication with 7-day expiration
- **Password Hashing** - bcrypt with salt rounds
- **Role-based Access** - Admin and customer roles
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured for secure cross-origin requests

## 📊 API Endpoints

### **Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `PUT /api/v1/auth/profile` - Update profile

### **Products**
- `GET /api/v1/product/get-product` - Get all products
- `GET /api/v1/product/get-product/:slug` - Get single product
- `POST /api/v1/product/create-product` - Create product (Admin)
- `PUT /api/v1/product/update-product/:id` - Update product (Admin)

### **Categories**
- `GET /api/v1/category/get-category` - Get all categories
- `POST /api/v1/category/create-category` - Create category (Admin)

### **Orders**
- `GET /api/v1/auth/orders` - Get user orders
- `GET /api/v1/auth/all-orders` - Get all orders (Admin)

## 🎯 Key Achievements

✅ **Complete MERN Stack Implementation**  
✅ **Modern, Responsive UI with Tailwind CSS**  
✅ **Secure Authentication & Authorization**  
✅ **File Upload & Image Management**  
✅ **Shopping Cart with Persistence**  
✅ **Order Management System**  
✅ **Admin Dashboard with Full CRUD**  
✅ **Mobile-First Responsive Design**  
✅ **Performance Optimizations**  
✅ **Clean, Maintainable Code Structure**  

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- **React Team** for the amazing React library
- **Tailwind CSS** for the utility-first CSS framework
- **MongoDB** for the flexible NoSQL database
- **Express.js** for the minimal web framework
- **All contributors** who helped make this project better

---

**⭐ If you found this project helpful, please give it a star!**

**📚 Booklet - Your Gateway to the World of Books**
