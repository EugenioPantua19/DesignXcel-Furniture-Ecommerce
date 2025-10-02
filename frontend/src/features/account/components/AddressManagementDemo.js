import React, { useState } from 'react';
import { LoadingSpinner, InlineLoader } from '../../../shared/components/ui';

// Demo component showing the enhanced address management features
const AddressManagementDemo = () => {
  const [demoLoading, setDemoLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const simulateLoading = () => {
    setDemoLoading(true);
    setTimeout(() => setDemoLoading(false), 3000);
  };

  const simulateButtonAction = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Enhanced Address Management Features</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>1. Page Loading State</h3>
        <p>Full-screen loading spinner for initial page loads</p>
        <button onClick={simulateLoading} style={{ padding: '10px 20px', marginBottom: '20px' }}>
          Simulate Page Loading
        </button>
        
        {demoLoading && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <LoadingSpinner 
              fullScreen={true} 
              text="Loading address management..." 
              color="#F0B21B" 
              size="large"
            />
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>2. Form Submit Loading</h3>
        <p>Inline loading spinner for form submissions</p>
        
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px', 
          padding: '20px' 
        }}>
          <form onSubmit={(e) => { e.preventDefault(); simulateButtonAction(); }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                Address Title
              </label>
              <input 
                type="text" 
                placeholder="e.g., Home, Office" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            <InlineLoader 
              isLoading={buttonLoading} 
              text="Adding address..."
              size="small"
            >
              <button 
                type="submit" 
                disabled={buttonLoading}
                style={{ 
                  padding: '10px 20px', 
                  background: '#F0B21B', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Add Address
              </button>
            </InlineLoader>
          </form>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>3. Action Button Loading States</h3>
        <p>Loading states for individual action buttons</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <InlineLoader isLoading={buttonLoading} text="Setting..." size="small">
            <button 
              onClick={simulateButtonAction}
              disabled={buttonLoading}
              style={{ 
                padding: '6px 12px', 
                background: 'transparent', 
                color: '#f7b500', 
                border: '1px solid #f7b500', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Set as Default
            </button>
          </InlineLoader>
          
          <button 
            style={{ 
              padding: '6px 12px', 
              background: 'transparent', 
              color: '#666', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          
          <InlineLoader isLoading={buttonLoading} text="Deleting..." size="small">
            <button 
              onClick={simulateButtonAction}
              disabled={buttonLoading}
              style={{ 
                padding: '6px 12px', 
                background: 'transparent', 
                color: '#e74c3c', 
                border: '1px solid #e74c3c', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </InlineLoader>
        </div>
      </div>

      <div>
        <h3>4. Address Management Features</h3>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h4>✅ Complete Address Management System:</h4>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li><strong>Add New Address:</strong> Complete form with all address fields</li>
            <li><strong>Edit Address:</strong> Update existing address information</li>
            <li><strong>Delete Address:</strong> Remove addresses with confirmation</li>
            <li><strong>Set Default:</strong> Mark an address as default delivery address</li>
            <li><strong>Address Validation:</strong> Required fields and proper formatting</li>
            <li><strong>Loading States:</strong> Professional loading indicators for all actions</li>
            <li><strong>Error Handling:</strong> User-friendly error messages</li>
            <li><strong>Responsive Design:</strong> Works on all device sizes</li>
          </ul>
          
          <h4>🎯 User Experience Improvements:</h4>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Real-time loading feedback for all operations</li>
            <li>Disabled buttons during loading to prevent double-submission</li>
            <li>Clear visual feedback with brand-colored spinners</li>
            <li>Consistent loading text for different actions</li>
            <li>Professional form design with proper spacing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddressManagementDemo;
