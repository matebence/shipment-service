const node = require('./resources/bootstrap');
const client = require("cloud-config-client");
const bodyParser = require('body-parser');
const express = require('express');

const app = express();

app.use(bodyParser.json());

client.load({
    endpoint: node.cloud.config.uri,
    name: node.application.name,
    profiles: node.profiles.active,
    auth: {user: node.cloud.config.username, pass: node.cloud.config.password}
}).then(config => {
    config.bootstrap = node;

    return app.listen(node.server.port);
}).then(() => {
    console.log(`Server beží na porte ${node.server.port}`)
}).catch(console.error);