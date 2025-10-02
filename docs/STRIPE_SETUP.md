# Stripe Payment Integration Setup

## Backend Setup

1. **Environment Variables**: Make sure your `.env` file in the backend folder contains:

   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

2. **Dependencies**: Stripe SDK is already installed in the backend.

## Frontend Setup

1. **Environment Variables**: Create a `.env` file in the frontend folder with:

   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

2. **Dependencies**: Stripe.js is already installed in the frontend.

## How It Works

1. When the "Proceed" button is clicked on the E-Wallets tab:

   - The frontend calculates the cart total
   - Creates a payment intent via the backend API
   - Redirects to Stripe Checkout
   - After payment, redirects to `/order-success` or back to `/payment` if cancelled

2. The backend provides two endpoints:
   - `/api/create-payment-intent`: Creates a Stripe payment intent
   - `/api/confirm-payment`: Confirms payment completion

## Testing

1. Start your backend server: `cd backend && npm start`
2. Start your frontend: `cd frontend && npm start`
3. Navigate to the payment page and click "Proceed" on the E-Wallets tab
4. You'll be redirected to Stripe's test checkout page

## Test Card Numbers

Use these test card numbers in Stripe Checkout:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## Notes

- Make sure to replace the placeholder keys with your actual Stripe test keys
- The integration uses Stripe Checkout for a secure, hosted payment experience
- Cart data is retrieved from localStorage - you may want to integrate with your cart context
- The backend runs on port 5000 to match the frontend API calls
