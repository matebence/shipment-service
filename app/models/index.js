module.exports = (app, config) => {
    const strings = require('../../resources/strings');
    const data = require('../../resources/data.json');
    const mongoose = require("mongoose");
    const redis = require("redis");

    const mongoClient = mongoose.connect(`${config.get('node.datasource.driver')}://${config.get('node.datasource.host')}:${config.get('node.datasource.port')}/${config.get('node.datasource.database')}?retryWrites=false`,
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

    const redisClient = redis.createClient({
        host: config.get('node.datasource.redis.host'),
        port: config.get('node.datasource.redis.port'),
        password: config.get('node.datasource.redis.password')
    }).on("error", (error) => {
        console.log(`${strings.REDIS_DATABASE_CONNECTION_ERROR} ${config.get('node.datasource.redis.host')}:${config.get('node.datasource.redis.port')}`);
    });

    mongoose.connection.on("connected", function () {
        console.log(`${strings.MONGO_DATABASE_CONNECTED} ${config.get('node.datasource.host')}:${config.get('node.datasource.port')}`);
    });
    mongoose.connection.on("error", function (error) {
        console.log(`${strings.MONGO_DATABASE_CONNECTION_ERROR} ${config.get('node.datasource.port')}:${config.port} - ${error}`);
    });
    mongoose.connection.on("disconnected", function () {
        console.log(`${strings.MONGO_DATABASE_DISCONNECTED} ${config.get('node.datasource.host')}:${config.get('node.datasource.port')}`);
    });

    const database = {};
    database.mongoose = mongoose;
    database.redis = redisClient;

    if (config.get('node.mongoose.create-drop')) mongoose.connection.dropDatabase(config.get('node.datasource.database'));

    database.prices = require("./prices.model")(mongoose, mongoose.Schema, mongoose.model);
    database.status = require("./status.model")(mongoose, mongoose.Schema, mongoose.model);
    database.invoices = require("./invoices.model")(mongoose, mongoose.Schema, mongoose.model);
    database.shipments = require("./shipments.model")(mongoose, mongoose.Schema, mongoose.model);

    database.status.insertMany(data.status, (err, result) => {
        database.prices.insertMany(data.prices, (err, result) => {
            // database.shipments.insertMany(data.shipments, (err, result) => {
                err ? console.log(strings.DATABASE_SEED_ERR) : console.log(strings.DATABASE_SEED)
            // });
        });
    });

    module.exports = database;
};