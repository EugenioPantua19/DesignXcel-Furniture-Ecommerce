# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Remove any existing package-lock.json to force npm install
RUN rm -f package-lock.json

# Copy package.json only
COPY package.json ./

# Install dependencies using npm install (explicitly avoid npm ci)
RUN npm install --no-package-lock

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "serve"]
