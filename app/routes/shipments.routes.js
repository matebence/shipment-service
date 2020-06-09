module.exports = app => {
    const shipments = require("../controllers/shipments.controller");
    const router = require("express").Router();

    router.post("/", shipments.create.authorize, shipments.create.checkBody, shipments.create.validate, shipments.create.inDatabase);

    router.delete("/:id", shipments.delete.authorize, shipments.delete.validate, shipments.delete.inDatabase);

    router.put("/:id", shipments.update.authorize, shipments.update.checkBody, shipments.update.validate, shipments.update.inDatabase);

    router.get("/:id", shipments.get.authorize, shipments.get.validate, shipments.get.inDatabase);

    router.get("/page/:pageNumber/limit/:pageSize", shipments.getAll.authorize, shipments.getAll.validate, shipments.getAll.inDatabase);

    router.post("/search", shipments.search.authorize, shipments.search.checkBody, shipments.search.inDatabase);

    app.use('/api/shipments', router);
};