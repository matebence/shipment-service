FROM node:10.21.0-jessie
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir public
RUN mkdir public/invoices
RUN chmod 777 public
CMD ["./wait-for-it.sh" , "place-service:5000" , "--strict" , "--timeout=360" , "--" , "node", "server.js"]