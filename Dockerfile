# Intermediate docker image to build the bundle in and install dependencies
FROM node:19.2-bullseye-slim as build

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Install Git
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean

# Copy the package.json and package-lock.json over in the intermediate "build" image
COPY package*.json ./

# Install the dependencies
# Clean install because we want to install the exact versions
RUN npm ci

# Copy the source code into the build image
COPY ./ ./

# Build the TypeScript application for production
# RUN npm run build

# Intermediate docker image to build the bundle in and install dependencies
FROM node:19.2-bullseye-slim as production

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Install Git
RUN apt-get update && \
    apt-get install -y git && \
    apt-get clean

# Copy the package.json and package-lock.json over in the intermediate "build" image
COPY package*.json ./

# Install the dependencies
# Clean install because we want to install the exact versions
RUN npm ci --only=production

# Copy the source code into the build image
COPY --from=build /usr/src/app /usr/src/app

# Expose port 3000 (default port)
EXPOSE 8080

# Start the application
# CMD [ "node", "dist/server.js" ]
CMD [ "npm", "run", "dev"]