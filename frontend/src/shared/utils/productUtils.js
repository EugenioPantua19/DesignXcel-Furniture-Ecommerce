import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a URL-friendly slug from a product name
 * @param {string} name - Product name
 * @returns {string} - URL-friendly slug
 */
export const generateSlug = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate a unique public identifier for a product
 * @param {string} name - Product name
 * @param {number} id - Internal database ID (optional)
 * @returns {string} - Public UUID
 */
export const generatePublicId = (name, id = null) => {
  // Use UUID v4 for public-facing IDs
  return uuidv4();
};

/**
 * Generate a SKU from product information
 * @param {string} category - Product category
 * @param {string} name - Product name
 * @param {number} id - Internal database ID
 * @returns {string} - SKU format: CAT-XXXX-YYYY
 */
export const generateSKU = (category, name, id) => {
  const categoryCode = category ? category.substring(0, 3).toUpperCase() : 'PRD';
  const nameCode = name ? name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'ITEM';
  const idCode = id ? id.toString().padStart(4, '0') : '0000';
  
  return `${categoryCode}-${nameCode}-${idCode}`;
};

/**
 * Validate if a string is a valid UUID
 * @param {string} str - String to validate
 * @returns {boolean} - True if valid UUID
 */
export const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Extract product identifier from URL path
 * @param {string} path - URL path
 * @returns {string|null} - Product identifier or null
 */
export const extractProductIdFromPath = (path) => {
  const match = path.match(/\/product\/([^\/]+)/);
  return match ? match[1] : null;
};
