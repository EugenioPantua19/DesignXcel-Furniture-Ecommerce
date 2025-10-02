# Office Furniture 3D Configurator

A modern frontend-only office furniture e-commerce platform with advanced 3D product visualization and configuration, built with React.js and Three.js.

## Features

- **Advanced 3D Configurator** with real-time product visualization
- **Interactive 3D Models** using Three.js WebGL rendering
- **Real-time Customization** - dimensions, colors, materials
- **Mobile-Responsive Design** with touch gesture support
- **Modern React Frontend** with hooks and functional components
- **Touch-Friendly Interface** optimized for mobile devices
- **Professional UI/UX** with clean, modern design
- **Product Catalog** with category filtering
- **Frontend-Only Architecture** - No backend dependencies required

## Tech Stack

### Frontend
- **React.js 18** - Modern JavaScript framework
- **Three.js** - 3D graphics and WebGL rendering
- **CSS3** - Modern styling with flexbox and grid
- **React Hooks** - useState, useEffect, useRef
- **Responsive Design** - Mobile-first approach
- **Touch Gestures** - Pinch-to-zoom, drag rotation

## Project Structure

```
office-ecommerce/
├── frontend/                    # React.js frontend application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/              # Three.js 3D components
│   │   │   │   └── TableConfigurator.js
│   │   │   ├── common/          # Reusable components
│   │   │   └── layout/          # Layout components
│   │   ├── pages/               # React page components
│   │   │   ├── Home.js
│   │   │   ├── Products.js
│   │   │   └── ProductDetail.js
│   │   ├── styles/              # CSS stylesheets
│   │   │   ├── configurator.css
│   │   │   └── global.css
│   │   ├── utils/               # Utility functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── start.bat                    # Windows startup script
├── start.sh                     # Unix/Linux startup script
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support
- Git

### Quick Start
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd office-ecommerce
   ```

2. Run the startup script:
   - **Windows**: Double-click `start.bat` or run in command prompt
   - **Unix/Linux/Mac**: Run `./start.sh` in terminal

3. The script will automatically:
   - Navigate to the frontend directory
   - Install dependencies
   - Start the development server

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Manual Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Build for Production
1. Create a production build:
   ```bash
   npm run build
   ```

2. The build files will be generated in the `build/` directory

## 3D Configurator Features

### Advanced 3D Visualization
- **Real-time 3D Models** - Interactive Three.js WebGL rendering
- **Camera Controls** - Mouse drag rotation, wheel zoom, touch gestures
- **View Presets** - Front, Side, Top, and Isometric views
- **Mobile Optimization** - Touch-friendly controls with pinch-to-zoom

### Product Customization
- **Dynamic Dimensions** - Real-time width, depth, height adjustment
- **Material Selection** - Wood, metal, glass, fabric options
- **Color Customization** - Extensive color palette with live preview
- **Live Pricing** - Dynamic price calculation based on configuration

### User Interface
- **Modern Design** - Clean, professional interface with yellow accents
- **Responsive Layout** - Mobile-first design that works on all devices
- **Touch Gestures** - Full touch support for mobile devices
- **Smooth Animations** - Fluid transitions and hover effects

## Development

### Available Scripts
In the frontend directory, you can run:

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers with WebGL support

## Pages & Components

### Home Page
- Modern hero section with call-to-action
- Featured categories grid with navigation
- Featured products showcase
- Responsive design for all devices

### Product Catalog
- Grid layout with product cards
- Category filtering and navigation
- Responsive design with mobile optimization
- Product preview with pricing

### 3D Product Configurator
- **Interactive 3D Models** - Real-time Three.js rendering
- **Advanced Controls** - Camera rotation, zoom, view presets
- **Live Customization** - Dimensions, colors, materials
- **Modern Order Summary** - Clean design with yellow accents
- **Mobile Responsive** - Touch gestures and optimized layout
- **Real-time Pricing** - Dynamic price calculation

### Key Components
- **TableConfigurator.js** - Main 3D configurator component
- **Three.js Integration** - WebGL 3D rendering engine
- **Responsive Layout** - Mobile-first design approach
- **Touch Controls** - Pinch-to-zoom and drag rotation

## Technologies Used

### Core Technologies
- **React.js 18** - Modern JavaScript framework with hooks
- **Three.js** - 3D graphics library for WebGL rendering
- **CSS3** - Modern styling with flexbox, grid, and animations
- **Create React App** - Development environment and build tools

### 3D Graphics Features
- **WebGL Rendering** - Hardware-accelerated 3D graphics
- **Real-time Interaction** - Mouse and touch controls
- **Dynamic Geometry** - Procedural 3D model generation
- **Material System** - Multiple material types and colors
- **Camera Controls** - Orbital controls with smooth animation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on desktop and mobile
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

## License

This project is licensed under the ISC License.

## Contact

For questions or support, contact:
- Email: designexcellence1@gmail.com
- Phone: (02) 413-6682

---

**Built with ❤️ using React.js and Three.js**
