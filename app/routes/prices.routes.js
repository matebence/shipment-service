module.exports = app => {
    const prices = require("../controllers/prices.controller");
    const router = require("express").Router();

    router.post("/", prices.create.authorize, prices.create.checkBody, prices.create.validate, prices.create.inDatabase);

    router.delete("/:id", prices.delete.authorize, prices.delete.validate, prices.delete.inDatabase);

    router.put("/:id", prices.update.authorize, prices.update.checkBody, prices.update.validate, prices.update.inDatabase);

    router.get("/:id", prices.get.authorize, prices.get.validate, prices.get.inDatabase);

    app.use('/api/prices', router);
};