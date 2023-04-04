# Intermediate docker image to build the bundle in and install dependencies
FROM node:19.2-alpine3.15 as build

# Set the working directory to /usr/src/app
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json over in the intermedate "build" image
COPY package*.json ./

# Install the dependencies
# Clean install because we want to install the exact versions
RUN npm ci

# Copy the source code into the build image
COPY ./ ./

# Install Git
RUN apk update && \
    apk upgrade && \
    apk add git

# Expose port 3000 (default port)
EXPOSE 8080

# Start the application
CMD [ "npm", "run", "dev"]