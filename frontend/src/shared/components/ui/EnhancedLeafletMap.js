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

const EnhancedLeafletMap = ({ 
  height = '450px',
  width = '100%'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationData, setLocationData] = useState({
    coordinates: [14.640700042873558, 121.00340179095328], // Updated precise coordinates
    address: '1 Binmaka St, cor Biak na Bato, Quezon City, 1115 Kalakhang Maynila',
    isGeocoded: true // Set to true since we have precise coordinates
  });

  // Using precise coordinates - no need for geocoding
  // useEffect(() => {
  //   // Geocoding removed since we have precise coordinates
  // }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      try {
        // Ensure the container exists and has dimensions
        if (!mapRef.current || mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          // Retry after a short delay if container has no dimensions
          setTimeout(initMap, 100);
          return;
        }

        // Check if Leaflet is properly loaded
        if (typeof L === 'undefined' || !L.map) {
          console.error('Leaflet is not properly loaded');
          return;
        }

        const map = L.map(mapRef.current, {
          center: locationData.coordinates,
          zoom: 16, // Closer zoom for detailed view
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false,
          // Add these options to prevent the _leaflet_pos error
          renderer: L.canvas(),
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        });

        mapInstanceRef.current = map;

        // Add tile layer with error handling
        try {
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);
        } catch (tileError) {
          console.error('Error adding tile layer:', tileError);
        }

        // Create custom icon for Design Excellence
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, #F0B21B 0%, #e6a632 100%);
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              border: 4px solid #ffffff;
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              cursor: pointer;
            ">
              <div style="
                transform: rotate(45deg);
                color: #2c3e50;
                font-weight: bold;
                font-size: 16px;
                line-height: 1;
              ">DE</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        // Create detailed popup content
        const popupContent = `
          <div style="
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 300px;
            padding: 0;
          ">
            <div style="
              background: linear-gradient(135deg, #F0B21B 0%, #e6a632 100%);
              color: #2c3e50;
              padding: 15px;
              margin: -10px -10px 10px -10px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            ">
              <h3 style="margin: 0; font-size: 18px; font-weight: bold;">Design Excellence</h3>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Our Main Office</p>
            </div>
            
            <div style="padding: 0 10px 10px 10px;">
              <div style="
                display: flex;
                align-items: flex-start;
                gap: 10px;
                margin-bottom: 12px;
              ">
                <div style="
                  background: rgba(240, 178, 27, 0.1);
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0B21B" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <strong style="color: #2c3e50; font-size: 14px;">Address:</strong><br>
                  <span style="color: #495057; font-size: 13px; line-height: 1.4;">
                    1 Binmaka St, cor Biak na Bato<br>
                    Quezon City, 1115 Kalakhang Maynila<br>
                    Philippines
                  </span>
                </div>
              </div>
              
              <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
              ">
                <div style="
                  background: rgba(240, 178, 27, 0.1);
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0B21B" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                <div>
                  <strong style="color: #2c3e50; font-size: 14px;">Business Hours:</strong><br>
                  <span style="color: #495057; font-size: 13px;">
                    Mon-Fri: 9:00 AM - 6:00 PM<br>
                    Sat: 9:00 AM - 4:00 PM<br>
                    Sun: Closed
                  </span>
                </div>
              </div>
              
              <div style="
                display: flex;
                gap: 8px;
                margin-top: 15px;
              ">
                <a href="tel:+63-2-1234-5678" style="
                  background: #F0B21B;
                  color: #2c3e50;
                  padding: 8px 12px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-size: 12px;
                  font-weight: 600;
                  flex: 1;
                  text-align: center;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#e6a632'" onmouseout="this.style.background='#F0B21B'">
                  📞 Call Us
                </a>
                <a href="/contact" style="
                  background: #ffffff;
                  color: #F0B21B;
                  border: 2px solid #F0B21B;
                  padding: 8px 12px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-size: 12px;
                  font-weight: 600;
                  flex: 1;
                  text-align: center;
                  transition: all 0.2s ease;
                " onmouseover="this.style.background='#F0B21B'; this.style.color='#ffffff'" onmouseout="this.style.background='#ffffff'; this.style.color='#F0B21B'">
                  📧 Contact
                </a>
              </div>
            </div>
          </div>
        `;

        // Add marker with detailed popup - with error handling
        let marker = null;
        try {
          marker = L.marker(locationData.coordinates, { icon: customIcon }).addTo(map);
          marker.bindPopup(popupContent, {
            maxWidth: 350,
            className: 'custom-popup'
          });
        } catch (markerError) {
          console.error('Error adding main marker:', markerError);
          // Fallback to default marker
          try {
            marker = L.marker(locationData.coordinates).addTo(map);
            marker.bindPopup(locationData.address);
          } catch (fallbackError) {
            console.error('Error adding fallback marker:', fallbackError);
          }
        }

        // Add nearby landmarks layer (updated for new location)
        const nearbyLandmarks = [
          {
            name: "Quezon City Hall",
            coordinates: [14.6500, 121.0300],
            type: "government"
          },
          {
            name: "SM North EDSA",
            coordinates: [14.6560, 121.0280],
            type: "shopping"
          },
          {
            name: "Trinoma Mall",
            coordinates: [14.6520, 121.0250],
            type: "shopping"
          },
          {
            name: "Araneta Center",
            coordinates: [14.6200, 121.0000],
            type: "shopping"
          },
          {
            name: "Gateway Mall",
            coordinates: [14.6250, 121.0050],
            type: "shopping"
          }
        ];

        // Add landmark markers with error handling
        try {
          nearbyLandmarks.forEach(landmark => {
            try {
              const landmarkIcon = L.divIcon({
                className: 'landmark-marker',
                html: `
                  <div style="
                    background: ${landmark.type === 'shopping' ? '#28a745' : '#007bff'};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                  ">
                    ${landmark.type === 'shopping' ? '🛍️' : '🏛️'}
                  </div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              L.marker(landmark.coordinates, { icon: landmarkIcon })
                .addTo(map)
                .bindPopup(`
                  <div style="font-size: 13px;">
                    <strong>${landmark.name}</strong><br>
                    <span style="color: #666;">${landmark.type === 'shopping' ? 'Shopping Center' : 'Government Building'}</span>
                  </div>
                `);
            } catch (landmarkError) {
              console.error(`Error adding landmark ${landmark.name}:`, landmarkError);
            }
          });
        } catch (landmarksError) {
          console.error('Error adding landmarks:', landmarksError);
        }

        // Set view to show the area with landmarks - with error handling
        try {
          if (marker) {
            const group = new L.featureGroup([marker, ...nearbyLandmarks.map(l => L.marker(l.coordinates))]);
            map.fitBounds(group.getBounds().pad(0.1));
          } else {
            // If no marker, just set view to coordinates
            map.setView(locationData.coordinates, 16);
          }
        } catch (boundsError) {
          console.error('Error setting map bounds:', boundsError);
          // Fallback to simple setView
          try {
            map.setView(locationData.coordinates, 16);
          } catch (setViewError) {
            console.error('Error setting map view:', setViewError);
          }
        }

        // Add scale control with error handling
        try {
          L.control.scale({
            position: 'bottomright',
            metric: true,
            imperial: false
          }).addTo(map);
        } catch (scaleError) {
          console.error('Error adding scale control:', scaleError);
        }

        // Force a resize to ensure proper rendering with error handling
        setTimeout(() => {
          try {
            if (map && map.invalidateSize) {
              map.invalidateSize();
            }
          } catch (resizeError) {
            console.error('Error invalidating map size:', resizeError);
          }
        }, 100);

        setIsMapReady(true);

      } catch (error) {
        console.error('Map initialization error:', error);
      }
    };

    const timer = setTimeout(initMap, 200);

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
          console.error('Map cleanup error:', error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
      setIsMapReady(false);
    };
  }, [locationData.coordinates]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: height, 
        width: width,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f8f9fa',
        position: 'relative',
        minHeight: '300px' // Ensure minimum height to prevent dimension issues
      }}
      className={`enhanced-leaflet-map-container ${!isMapReady ? 'loading' : ''}`}
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

export default EnhancedLeafletMap;
