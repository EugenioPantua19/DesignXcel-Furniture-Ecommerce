import { useCurrency } from '../contexts/CurrencyContext';

// Custom hook for price formatting
export const usePrice = () => {
    const { formatPrice } = useCurrency();

    // Format a single price
    const formatSinglePrice = (priceInPHP) => {
        if (!priceInPHP || isNaN(priceInPHP)) return formatPrice(0);
        return formatPrice(priceInPHP);
    };

    // Format price with discount
    const formatPriceWithDiscount = (originalPrice, discountPrice) => {
        const formatted = {
            original: formatSinglePrice(originalPrice),
            discount: discountPrice ? formatSinglePrice(discountPrice) : null,
            hasDiscount: !!discountPrice && discountPrice < originalPrice
        };
        return formatted;
    };

    // Calculate savings amount
    const calculateSavings = (originalPrice, discountPrice) => {
        if (!discountPrice || discountPrice >= originalPrice) return null;
        const savings = originalPrice - discountPrice;
        return formatSinglePrice(savings);
    };

    // Calculate savings percentage
    const calculateSavingsPercentage = (originalPrice, discountPrice) => {
        if (!discountPrice || discountPrice >= originalPrice) return null;
        const percentage = ((originalPrice - discountPrice) / originalPrice) * 100;
        return Math.round(percentage);
    };

    // Format cart total
    const formatCartTotal = (items) => {
        const total = items.reduce((sum, item) => {
            const price = item.discountPrice || item.price;
            return sum + (price * item.quantity);
        }, 0);
        return formatSinglePrice(total);
    };

    // Format cart subtotal (before tax/shipping)
    const formatCartSubtotal = (items) => {
        return formatCartTotal(items);
    };

    // Format tax amount
    const formatTax = (subtotal, taxRate = 0.08) => {
        const taxAmount = subtotal * taxRate;
        return formatSinglePrice(taxAmount);
    };

    // Format shipping cost
    const formatShipping = (shippingCost) => {
        return formatSinglePrice(shippingCost);
    };

    // Get current currency symbol
    const getCurrencySymbol = () => {
        return '₱';
    };

    // Get current currency code
    const getCurrencyCode = () => {
        return 'PHP';
    };

    return {
        formatSinglePrice,
        formatPriceWithDiscount,
        calculateSavings,
        calculateSavingsPercentage,
        formatCartTotal,
        formatCartSubtotal,
        formatTax,
        formatShipping,
        getCurrencySymbol,
        getCurrencyCode
    };
};

export default usePrice;
