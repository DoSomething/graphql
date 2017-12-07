FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
