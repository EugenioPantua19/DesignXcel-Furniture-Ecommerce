import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SimpleLeafletMap = ({ 
  center = [14.640700042873558, 121.00340179095328],
  zoom = 13,
  height = '450px',
  width = '100%',
  markerPopup = '1 Binmaka St, cor Biak na Bato, Quezon City, 1115 Kalakhang Maynila'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create a simple, robust map initialization
    const initMap = () => {
      try {
        const map = L.map(mapRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false // Use SVG for better compatibility
        });

        mapInstanceRef.current = map;

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add simple marker
        const marker = L.marker(center).addTo(map);
        marker.bindPopup(markerPopup);

        // Set view to ensure proper rendering
        map.setView(center, zoom);

        // Force a resize to ensure proper rendering
        setTimeout(() => {
          if (map && map.invalidateSize) {
            map.invalidateSize();
          }
        }, 100);

      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    // Initialize with a delay to ensure DOM is ready
    const timer = setTimeout(initMap, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Map cleanup error:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, markerPopup]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: height, 
        width: width,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f8f9fa'
      }}
      className="simple-leaflet-map-container"
    />
  );
};

export default SimpleLeafletMap;
