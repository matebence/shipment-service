module.exports = (app, config) => {
    const mailer = require('../component/nodemailer.component');
    const strings = require('../../resources/strings');
    const data = require('../../resources/data.json');
    const mongoose = require("mongoose");

    console.log(mailer.html(
        "./resources/templates/shipmentNotification.ejs",
        {shipmentStatus: "Done"},
        {to: "m.bence05@gmail.com",
            subject: 'Test'
        }));

    mongoose.connect(`${config.get('node.datasource.driver')}://${config.get('node.datasource.host')}:${config.get('node.datasource.port')}/${config.get('node.datasource.database')}?retryWrites=false`,
        {
            useUnifiedTopology: true,
            useFindAndModify: false,
            useNewUrlParser: true,
            useCreateIndex: true,
            auth: {
                authSource: "admin"
            },
            user: config.get('node.datasource.username'),
            pass: config.get('node.datasource.password')
        }
    );

    mongoose.connection.on("connected", function () {
        console.log(`${strings.DATABASE_CONNECTED} ${config.get('node.datasource.host')}:${config.get('node.datasource.port')}`);
    });
    mongoose.connection.on("error", function (error) {
        console.log(`${strings.DATABASE_CONNECTION_ERROR} ${config.get('node.datasource.port')}:${config.port} - ${error}`);
    });
    mongoose.connection.on("disconnected", function () {
        console.log(`${strings.DATABASE_DISCONNECTED} ${config.get('node.datasource.host')}:${config.get('node.datasource.port')}`);
    });

    const database = {};
    database.mongoose = mongoose;

    if (config.get('node.mongoose.create-drop')) mongoose.connection.dropDatabase(config.get('node.datasource.database'));

    database.status = require("./status.mode")(mongoose, mongoose.Schema, mongoose.model);
    database.shipments = require("./shipments.model")(mongoose, mongoose.Schema, mongoose.model);

    database.status.insertMany(data.status, (err, result) => {
        database.shipments.insertMany(data.shipments, (err, result) => {
            err ? console.log(strings.DATABASE_SEED_ERR) : console.log(strings.DATABASE_SEED)
        });
    });

    module.exports = database;
};