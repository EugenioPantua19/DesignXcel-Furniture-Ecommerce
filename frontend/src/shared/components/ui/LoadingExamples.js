import React, { useState } from 'react';
import { LoadingSpinner, PageLoader, InlineLoader } from './index';

// Example component showing different ways to use loading spinners
const LoadingExamples = () => {
  const [pageLoading, setPageLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const handlePageLoad = () => {
    setPageLoading(true);
    setTimeout(() => setPageLoading(false), 3000);
  };

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const handleFormSubmit = () => {
    setFormLoading(true);
    setTimeout(() => setFormLoading(false), 1500);
  };

  return (
    <PageLoader isLoading={pageLoading} text="Loading example page...">
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Loading Spinner Examples</h1>
        
        <div style={{ marginBottom: '40px' }}>
          <h2>1. Page Loader</h2>
          <p>Full-screen loading for initial page loads</p>
          <button onClick={handlePageLoad} style={{ padding: '10px 20px' }}>
            Trigger Page Load
          </button>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2>2. Inline Loader</h2>
          <p>Loading states for buttons and forms</p>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Button Loading</h3>
            <InlineLoader isLoading={buttonLoading} text="Processing...">
              <button onClick={handleButtonClick} style={{ padding: '10px 20px' }}>
                Process Data
              </button>
            </InlineLoader>
          </div>

          <div>
            <h3>Form Loading</h3>
            <InlineLoader isLoading={formLoading} text="Submitting...">
              <button onClick={handleFormSubmit} style={{ padding: '10px 20px' }}>
                Submit Form
              </button>
            </InlineLoader>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2>3. Custom Loading Spinner</h2>
          <p>Direct spinner usage with custom options</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4>Small</h4>
              <LoadingSpinner size="small" text="Small spinner" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>Medium</h4>
              <LoadingSpinner size="medium" text="Medium spinner" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>Large</h4>
              <LoadingSpinner size="large" text="Large spinner" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>XL</h4>
              <LoadingSpinner size="xl" text="Extra large spinner" />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2>4. Custom Colors</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h4>Brand Color</h4>
              <LoadingSpinner size="medium" color="#F0B21B" text="Brand color" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>Blue</h4>
              <LoadingSpinner size="medium" color="#007bff" text="Blue spinner" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>Green</h4>
              <LoadingSpinner size="medium" color="#28a745" text="Green spinner" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h4>Red</h4>
              <LoadingSpinner size="medium" color="#dc3545" text="Red spinner" />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2>5. Overlay Spinner</h2>
          <p>Spinner with overlay background</p>
          <div style={{ position: 'relative', height: '200px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <div style={{ padding: '20px' }}>
              <p>This is some content that can be covered by an overlay spinner.</p>
              <p>Perfect for loading states within components.</p>
            </div>
            <LoadingSpinner 
              overlay={true} 
              text="Loading overlay content..." 
              size="large"
            />
          </div>
        </div>

        <div>
          <h2>6. Usage Examples</h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h4>Code Examples:</h4>
            <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
{`// Page Loader
<PageLoader isLoading={loading} text="Loading page...">
  <YourPageContent />
</PageLoader>

// Inline Loader
<InlineLoader isLoading={submitting} text="Saving...">
  <button onClick={handleSubmit}>Save</button>
</InlineLoader>

// Custom Spinner
<LoadingSpinner 
  size="large" 
  color="#F0B21B" 
  text="Loading products..." 
/>`}
            </pre>
          </div>
        </div>
      </div>
    </PageLoader>
  );
};

export default LoadingExamples;
