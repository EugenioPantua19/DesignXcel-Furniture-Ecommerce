# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies using npm install (not npm ci)
RUN npm install --production

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads/profile-images

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
