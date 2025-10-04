# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Remove any existing package-lock.json to force npm install
RUN rm -f package-lock.json

# Copy package.json only
COPY package.json ./

# Install dependencies using npm install (explicitly avoid npm ci)
RUN npm install --production --no-package-lock

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads/profile-images

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
