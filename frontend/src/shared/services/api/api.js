// API service for frontend application
// This handles both mock data and real API calls

// Mock data for products (fallback)
const mockProducts = [
  {
    id: 1,
    name: "Executive Office Table",
    description: "Premium executive office table with modern design and customizable features.",
    basePrice: 500,
    category: "Tables",
    image: "/images/table-1.jpg",
    features: ["Adjustable height", "Premium materials", "Modern design", "Customizable"]
  },
  {
    id: 2,
    name: "Ergonomic Office Chair",
    description: "Comfortable ergonomic office chair with lumbar support and adjustable features.",
    basePrice: 200,
    category: "Chairs",
    image: "/images/chair-1.jpg",
    features: ["Ergonomic design", "Lumbar support", "Adjustable height", "Breathable mesh"]
  },
  {
    id: 3,
    name: "Storage Cabinet",
    description: "Modern storage cabinet with multiple compartments and secure locking system.",
    basePrice: 800,
    category: "Storage",
    image: "/images/cabinet-1.jpg",
    features: ["Multiple compartments", "Secure locks", "Modern design", "Durable materials"]
  }
];

// Mock categories
const mockCategories = [
  { id: 1, name: "Tables", description: "Office tables and desks" },
  { id: 2, name: "Chairs", description: "Office chairs and seating" },
  { id: 3, name: "Storage", description: "Storage solutions and cabinets" },
  { id: 4, name: "Workstations", description: "Complete workstation setups" }
];

// API functions
const api = {
  // Get all products
  getProducts: () => {
    return Promise.resolve({
      success: true,
      data: mockProducts
    });
  },

  // Get product by ID
  getProduct: (id) => {
    const product = mockProducts.find(p => p.id === parseInt(id));
    return Promise.resolve({
      success: true,
      data: product || null
    });
  },

  // Get categories
  getCategories: () => {
    return Promise.resolve({
      success: true,
      data: mockCategories
    });
  },

  // Get project items
  getProjects: async () => {
    try {
      // Use absolute URL to ensure it reaches the backend
      const response = await fetch('http://localhost:5000/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch project data');
      }
      const data = await response.json();
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Return empty array as fallback
      return {
        success: false,
        data: []
      };
    }
  },

  // Mock authentication with admin support
  login: (credentials) => {
    // Check for admin credentials
    if (credentials.email === 'admin@designxcel.com' && credentials.password === 'admin123') {
      return Promise.resolve({
        success: true,
        data: {
          token: 'mock-admin-jwt-token',
          user: {
            id: 1,
            firstName: 'Admin',
            lastName: 'User',
            email: credentials.email,
            role: 'Admin'
          }
        }
      });
    }

    // Check for employee credentials
    if (credentials.email === 'manager@designxcel.com' && credentials.password === 'admin123') {
      return Promise.resolve({
        success: true,
        data: {
          token: 'mock-employee-jwt-token',
          user: {
            id: 2,
            firstName: 'Manager',
            lastName: 'User',
            email: credentials.email,
            role: 'Employee'
          }
        }
      });
    }

    // Regular customer login
    return Promise.resolve({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 3,
          firstName: 'Demo',
          lastName: 'User',
          email: credentials.email,
          role: 'Customer'
        }
      }
    });
  },

  // Mock registration (always succeeds)
  register: (userData) => {
    return Promise.resolve({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 1,
          name: userData.name,
          email: userData.email
        }
      }
    });
  }
};

export default api;
