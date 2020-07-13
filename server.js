const hateoasLinker = require('express-hateoas-links');
const expressValidator = require('express-validator');
const node = require('./resources/bootstrap');
const client = require("cloud-config-client");
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();

app.use(expressValidator());
app.use(bodyParser.json());
app.use(hateoasLinker);
app.use(helmet());

client.load({
    endpoint: node.cloud.config.uri,
    name: node.application.name,
    profiles: node.profiles.active,
    auth: {user: node.cloud.config.username, pass: node.cloud.config.password}
}).then(config => {
    global.appRoot = path.resolve(__dirname);
    config.bootstrap = node;

    require("./app/component/nodemailer.component")(app, config);
    require("./app/component/eureka.component")(app, config);
    require("./app/component/zipkin.component")(app, config);
    require("./app/component/resilient.component")(app, config, () => {

        require("./app/models")(app, config);
        require("./app/routes/auth.routes")(app, config);
        require("./app/routes/status.routes")(app);
        require("./app/routes/prices.routes")(app);
        require("./app/routes/invoices.routes")(app);
        require("./app/routes/shipments.routes")(app);
        require("./app/routes/errors.routes")(app);
    });

    return app.listen(node.server.port);
}).then(() => {
    console.log(`Server beží na porte ${node.server.port}`)
}).catch(console.error);