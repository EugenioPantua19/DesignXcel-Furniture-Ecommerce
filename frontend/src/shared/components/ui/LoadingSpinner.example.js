/**
 * Loading Spinner Usage Examples
 * Simple and consistent with design schema
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import InlineLoader from './InlineLoader';
import PageLoader from './PageLoader';

const LoadingSpinnerExamples = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Loading Spinner Examples</h2>
      
      {/* Basic Usage */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">Small</h4>
            <LoadingSpinner size="small" text="Loading..." />
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">Medium</h4>
            <LoadingSpinner size="medium" text="Loading..." />
          </div>
          <div className="p-4 border rounded">
            <h4 className="font-medium mb-2">Large</h4>
            <LoadingSpinner size="large" text="Loading..." />
          </div>
        </div>
      </div>

      {/* Inline Loader */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Inline Loader</h3>
        <button 
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Toggle Loading
        </button>
        <InlineLoader isLoading={isLoading} text="Loading data...">
          <div className="p-4 bg-gray-100 rounded">
            <p>Content loaded successfully!</p>
          </div>
        </InlineLoader>
      </div>

      {/* Page Loader */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Page Loader</h3>
        <PageLoader isLoading={false} text="Loading page...">
          <div className="p-4 bg-blue-100 rounded">
            <p>Page content loaded!</p>
          </div>
        </PageLoader>
      </div>

      {/* Overlay Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Overlay Examples</h3>
        <div className="relative h-32 bg-gray-100 rounded">
          <LoadingSpinner 
            size="medium" 
            text="Loading overlay..." 
            overlay={true}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinnerExamples;
