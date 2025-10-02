const { BlobServiceClient } = require('@azure/storage-blob');

// Initialize Azure Blob Storage client
const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  if (!accountName || !accountKey) {
    throw new Error('Azure Storage account name and key must be provided');
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
};

/**
 * Upload a file to Azure Blob Storage
 * @param {Object} file - The file object (from multer)
 * @param {string} containerName - The container name (default: 'uploads')
 * @param {string} folder - Optional folder path within container
 * @returns {Object} Upload result with URL and blob name
 */
const uploadToBlob = async (file, containerName = 'uploads', folder = '') => {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access for blobs
    });
    
    // Generate unique blob name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const blobName = folder 
      ? `${folder}/${timestamp}-${randomString}.${fileExtension}`
      : `${timestamp}-${randomString}.${fileExtension}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Set content type based on file type
    const contentType = file.mimetype || 'application/octet-stream';
    
    // Upload the file
    await blockBlobClient.upload(file.buffer, file.buffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
    
    return {
      url: blockBlobClient.url,
      blobName: blobName,
      containerName: containerName,
      success: true
    };
  } catch (error) {
    console.error('Error uploading to Azure Blob Storage:', error);
    throw new Error(`Failed to upload file to Azure Blob Storage: ${error.message}`);
  }
};

/**
 * Delete a file from Azure Blob Storage
 * @param {string} blobName - The blob name to delete
 * @param {string} containerName - The container name (default: 'uploads')
 * @returns {Object} Delete result
 */
const deleteFromBlob = async (blobName, containerName = 'uploads') => {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.deleteIfExists();
    
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting from Azure Blob Storage:', error);
    throw new Error(`Failed to delete file from Azure Blob Storage: ${error.message}`);
  }
};

/**
 * Get a signed URL for temporary access to a private blob
 * @param {string} blobName - The blob name
 * @param {string} containerName - The container name
 * @param {number} expiryMinutes - Minutes until expiry (default: 60)
 * @returns {string} Signed URL
 */
const getSignedUrl = async (blobName, containerName = 'uploads', expiryMinutes = 60) => {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    
    // Generate SAS token
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions: 'r', // Read permission
      expiresOn: expiryTime
    });
    
    return sasUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * List files in a container
 * @param {string} containerName - The container name
 * @param {string} prefix - Optional prefix to filter files
 * @returns {Array} List of blob items
 */
const listBlobs = async (containerName = 'uploads', prefix = '') => {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push({
        name: blob.name,
        url: `${containerClient.url}/${blob.name}`,
        lastModified: blob.properties.lastModified,
        contentLength: blob.properties.contentLength,
        contentType: blob.properties.contentType
      });
    }
    
    return blobs;
  } catch (error) {
    console.error('Error listing blobs:', error);
    throw new Error(`Failed to list blobs: ${error.message}`);
  }
};

/**
 * Check if Azure Storage is properly configured
 * @returns {boolean} Configuration status
 */
const isConfigured = () => {
  return !!(process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY);
};

module.exports = {
  uploadToBlob,
  deleteFromBlob,
  getSignedUrl,
  listBlobs,
  isConfigured
};
