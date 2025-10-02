# Loading Spinner Components

This directory contains reusable loading spinner components that can be used across the application.

## Components

### 1. LoadingSpinner
The base loading spinner component with customizable size, color, and text.

**Props:**
- `size` (string): 'small', 'medium', 'large', 'xl' (default: 'medium')
- `color` (string): Hex color for spinner and text (default: '#F0B21B')
- `text` (string): Loading text to display (default: 'Loading...')
- `overlay` (boolean): Add overlay background (default: false)
- `fullScreen` (boolean): Make it full screen (default: false)

**Usage:**
```jsx
import { LoadingSpinner } from '../shared/components/ui';

// Basic spinner
<LoadingSpinner />

// Custom spinner
<LoadingSpinner 
  size="large" 
  color="#F0B21B" 
  text="Loading products..." 
/>

// Overlay spinner
<LoadingSpinner 
  overlay={true} 
  text="Processing..." 
/>
```

### 2. PageLoader
Full-screen page loader that shows a loading spinner while content loads.

**Props:**
- `isLoading` (boolean): Whether to show loading state
- `text` (string): Loading text (default: 'Loading page...')
- `children` (ReactNode): Content to show when not loading

**Usage:**
```jsx
import { PageLoader } from '../shared/components/ui';

const MyPage = () => {
  const [loading, setLoading] = useState(true);

  return (
    <PageLoader isLoading={loading} text="Loading page...">
      <div>
        {/* Your page content */}
      </div>
    </PageLoader>
  );
};
```

### 3. InlineLoader
Inline loading spinner for smaller loading states (buttons, forms, etc.).

**Props:**
- `isLoading` (boolean): Whether to show loading state
- `text` (string): Loading text (default: 'Loading...')
- `size` (string): Spinner size (default: 'small')
- `children` (ReactNode): Content to show when not loading

**Usage:**
```jsx
import { InlineLoader } from '../shared/components/ui';

const MyButton = ({ loading, onClick }) => {
  return (
    <InlineLoader isLoading={loading} text="Saving...">
      <button onClick={onClick}>
        Save Changes
      </button>
    </InlineLoader>
  );
};
```

## Examples

### Product List with Loading
```jsx
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLoader isLoading={loading} text="Loading products...">
      <div className="product-list">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </PageLoader>
  );
};
```

### Form with Submit Loading
```jsx
const ContactForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await submitForm(data);
      // Success handling
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <InlineLoader isLoading={submitting} text="Sending...">
        <button type="submit">
          Send Message
        </button>
      </InlineLoader>
    </form>
  );
};
```

### Search Results with Loading
```jsx
const SearchResults = ({ query }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setLoading(true);
      searchProducts(query).then(data => {
        setResults(data);
        setLoading(false);
      });
    }
  }, [query]);

  return (
    <div className="search-results">
      {loading && (
        <LoadingSpinner 
          size="medium" 
          text="Searching products..." 
        />
      )}
      
      {!loading && results.map(result => (
        <SearchResultItem key={result.id} result={result} />
      ))}
    </div>
  );
};
```

## Styling

The spinner components use CSS classes that can be customized:

- `.loading-spinner`: Base spinner container
- `.loading-spinner--overlay`: Overlay background
- `.loading-spinner--fullscreen`: Full screen mode
- `.loading-spinner--small/medium/large/xl`: Size variants
- `.loading-spinner__spinner`: The actual spinning element
- `.loading-spinner__text`: Loading text

## Best Practices

1. **Use PageLoader for initial page loads**
2. **Use InlineLoader for form submissions and button actions**
3. **Use LoadingSpinner directly for custom loading states**
4. **Always provide meaningful loading text**
5. **Consider using overlay for actions that shouldn't be interrupted**
6. **Use appropriate sizes for the context (small for buttons, large for pages)**
