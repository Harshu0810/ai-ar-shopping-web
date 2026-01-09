# Use a lightweight Node.js version
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json to the container
COPY package.json ./

# Install dependencies (This bypasses the strict lockfile check)
RUN npm install

# Copy the rest of the backend files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
