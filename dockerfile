# Set the base image to use for subsequent instructions
FROM node:alpine

# Set the working directory for any subsequent ADD, COPY, CMD, ENTRYPOINT,
# or RUN instructions that follow it in the Dockerfile
WORKDIR /usr/src/app

# Copy files or folders from source to the dest path in the image's filesystem.
COPY package*.json  ./
COPY . /usr/src/app/

# Execute any commands on top of the current image as a new layer and commit the results.
RUN npm install 
ARG NODE_ENV

# Define the network ports that this container will listen to at runtime.
EXPOSE 8004

# Configure the container to be run as an executable.
# ENTRYPOINT [ "/bin/sh", "-c", "npm start"]
ENTRYPOINT ["npm", "start"]