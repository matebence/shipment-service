const hateoasLinker = require('express-hateoas-links');
const expressValidator = require('express-validator');
const node = require('./resources/bootstrap');
const client = require("cloud-config-client");
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const cors = require("cors");

const app = express();

app.use(expressValidator());
app.use(bodyParser.json());
app.use(hateoasLinker);
app.use(helmet());
app.use(cors());

client.load({
    endpoint: node.cloud.config.uri,
    name: node.application.name,
    profiles: node.profiles.active,
    auth: {user: node.cloud.config.username, pass: node.cloud.config.password}
}).then(config => {
    config.bootstrap = node;

    const { pdf } = require("./app/component/pdfkit.component");

    const invoice = {
        shipping: {
            name: "John Doe",
            address: "1234 Main Street",
            city: "San Francisco",
            state: "CA",
            country: "US",
            postal_code: 94111
        },
        items: [
            {
                item: "TC 100",
                description: "Toner Cartridge",
                quantity: 2,
                amount: 6000
            },
            {
                item: "USB_EXT",
                description: "USB Cable Extender",
                quantity: 1,
                amount: 2000
            }
        ],
        subtotal: 8000,
        paid: 0,
        invoice_nr: 1234
    };

    pdf.init(invoice, "invoice.pdf").addHeader().addCustomerDetails().createTable();

    require("./app/component/nodemailer.component")(app, config);
    require("./app/component/eureka.component")(app, config);
    require("./app/component/zipkin.component")(app, config);
    require("./app/component/resilient.component")(app, config, () => {

        require("./app/models")(app, config);
        require("./app/routes/auth.routes")(app, config);
        require("./app/routes/shipments.routes")(app);
        require("./app/routes/status.routes")(app);
        require("./app/routes/errors.routes")(app);
    });

    return app.listen(node.server.port);
}).then(() => {
    console.log(`Server beží na porte ${node.server.port}`)
}).catch(console.error);