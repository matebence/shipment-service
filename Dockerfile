FROM node:10.21.0-jessie
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod 777 /usr/src/app/public
CMD ["npm", "run", "start-server"]