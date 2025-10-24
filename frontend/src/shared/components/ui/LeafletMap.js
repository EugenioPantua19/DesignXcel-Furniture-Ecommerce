import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletMap = ({ 
  center = [14.640700042873558, 121.00340179095328], // Updated precise coordinates
  zoom = 13,
  height = '450px',
  width = '100%',
  markerTitle = 'Design Excellence Location',
  markerPopup = '1 Binmaka St, cor Biak na Bato, Quezon City, 1115 Kalakhang Maynila'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let map = null;
    
    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      
      try {
        // Ensure the container has dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          // Retry after a short delay if container has no dimensions
          setTimeout(initializeMap, 100);
          return;
        }

        // Check if Leaflet is properly loaded
        if (typeof L === 'undefined' || !L.map) {
          console.error('Leaflet is not properly loaded');
          return;
        }

        // Initialize the map with proper error handling
        map = L.map(mapRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: true,
          attributionControl: true,
          // Add these options to prevent the _leaflet_pos error
          renderer: L.canvas(),
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        });

        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles with error handling
        try {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);
        } catch (tileError) {
          console.error('Error adding tile layer:', tileError);
        }

        // Wait for map to be ready before adding marker
        map.whenReady(() => {
          try {
            // Add custom marker icon with your brand colors
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `
                <div style="
                  background: linear-gradient(135deg, #F0B21B 0%, #e6a632 100%);
                  width: 30px;
                  height: 30px;
                  border-radius: 50% 50% 50% 0;
                  border: 3px solid #ffffff;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  transform: rotate(-45deg);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                ">
                  <div style="
                    transform: rotate(45deg);
                    color: #2c3e50;
                    font-weight: bold;
                    font-size: 14px;
                    line-height: 1;
                  ">DE</div>
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 30],
              popupAnchor: [0, -30]
            });

            // Add marker
            const marker = L.marker(center, { icon: customIcon }).addTo(map);
            marker.bindPopup(markerPopup).openPopup();

            // Fit map to show marker with some padding
            map.fitBounds([[center[0] - 0.01, center[1] - 0.01], [center[0] + 0.01, center[1] + 0.01]], {
              padding: [20, 20]
            });

            setIsMapReady(true);
          } catch (markerError) {
            console.error('Error adding marker:', markerError);
            // Fallback to default marker
            const marker = L.marker(center).addTo(map);
            marker.bindPopup(markerPopup).openPopup();
            setIsMapReady(true);
          }
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapReady(false);
      }
    };

    // Initialize map with a small delay to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          // Remove all event listeners first
          if (mapInstanceRef.current.off) {
            mapInstanceRef.current.off();
          }
          
          // Remove all layers
          if (mapInstanceRef.current.eachLayer) {
            mapInstanceRef.current.eachLayer(function(layer) {
              try {
                mapInstanceRef.current.removeLayer(layer);
              } catch (layerError) {
                console.error('Error removing layer:', layerError);
              }
            });
          }
          
          // Remove the map instance
          if (mapInstanceRef.current.remove) {
            mapInstanceRef.current.remove();
          }
        } catch (error) {
          console.error('Error removing map:', error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
      setIsMapReady(false);
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
        position: 'relative',
        minHeight: '300px' // Ensure minimum height to prevent dimension issues
      }}
      className={`leaflet-map-container ${!isMapReady ? 'loading' : ''}`}
    >
      {!isMapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#6c757d',
          fontSize: '14px',
          zIndex: 1000
        }}>
          Loading map...
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
