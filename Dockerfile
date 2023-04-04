# Intermediate docker image to build the bundle in and install dependencies
FROM node:19.2-bullseye-slim as build

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json over in the intermediate "build" image
COPY package*.json ./

# Install the dependencies
# Clean install because we want to install the exact versions
RUN npm ci

# Copy the source code into the build image
COPY ./ ./

# Install Git
RUN apt update && \
    apt install -y git && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Build the TypeScript application for production
# RUN npm run build

# Intermediate docker image to build the bundle in and install dependencies
FROM node:19.2-bullseye-slim as production

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json over in the intermedate "build" image
COPY package*.json ./

# Install the dependencies
# Clean install because we want to install the exact versions
RUN npm ci --only=production

# Copy the source code into the build image
COPY --from=build /usr/src/app /usr/src/app

# Install Git
RUN apt update && \
    apt install -y git && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

# Expose port 3000 (default port)
EXPOSE 8080

# Start the application
# CMD [ "node", "dist/server.js" ]
CMD [ "npm", "run", "dev"]