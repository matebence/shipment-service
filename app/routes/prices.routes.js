module.exports = app => {
    const prices = require("../controllers/prices.controller");
    const router = require("express").Router();

    router.put("/:id", prices.update.authorize, prices.update.checkBody, prices.update.validate, prices.update.inDatabase);

    router.get("/:id", prices.get.authorize, prices.get.validate, prices.get.inDatabase);

    app.use('/api/prices', router);
};