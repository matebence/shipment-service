module.exports = app => {
    const shipments = require("../controllers/shipments.controller");
    const router = require("express").Router();

    router.post("/", shipments.create.authorize, shipments.create.checkBody, shipments.create.validate, shipments.create.inDatabase);

    router.delete("/:id", shipments.delete.authorize, shipments.delete.validate, shipments.delete.inDatabase);

    router.put("/:id", shipments.update.authorize, shipments.update.checkBody, shipments.update.validate, shipments.update.inDatabase);

    router.get("/:id", shipments.get.authorize, shipments.get.validate, shipments.get.inDatabase, shipments.get.fetchDataFromService, shipments.get.fetchDataFromCache);

    router.get("/page/:pageNumber/limit/:pageSize", shipments.getAll.authorize, shipments.getAll.validate, shipments.getAll.inDatabase, shipments.getAll.fetchDataFromService, shipments.getAll.fetchDataFromCache);

    router.post("/search", shipments.search.authorize, shipments.search.checkBody, shipments.search.inDatabase, shipments.search.fetchDataFromService, shipments.search.fetchDataFromCache);

    router.post("/join/:columnName", shipments.join.authorize, shipments.join.checkBody, shipments.join.validate, shipments.join.inDatabase);

    app.use('/api/shipments', router);
};