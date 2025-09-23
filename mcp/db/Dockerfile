# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Compile TypeScript
RUN npm run build

# Your app binds to port 8000, so expose it
EXPOSE 8000

# Define the command to run your app
CMD [ "npm", "start" ]
