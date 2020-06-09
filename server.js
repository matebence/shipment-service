const node = require('./resources/bootstrap');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();

app.use(bodyParser.json());

app.listen(node.server.port, () => {
    console.log(`Server beží na porte ${node.server.port}`)
});