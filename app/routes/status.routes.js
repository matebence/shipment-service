module.exports = app => {
    const status = require("../controllers/status.controller");
    const router = require("express").Router();

    router.post("/", status.create.authorize, status.create.checkBody, status.create.validate, status.create.inDatabase);

    router.delete("/:id", status.delete.authorize, status.delete.validate, status.delete.inDatabase);

    router.put("/:id", status.update.authorize, status.update.checkBody, status.update.validate, status.update.inDatabase);

    router.get("/:id", status.get.authorize, status.get.validate, status.get.inDatabase);

    router.get("/page/:pageNumber/limit/:pageSize", status.getAll.authorize, status.getAll.validate, status.getAll.inDatabase);

    router.post("/search", status.search.authorize, status.search.checkBody, status.search.inDatabase);

    router.post("/join/:columnName", status.join.authorize, status.join.checkBody, status.join.validate, status.join.inDatabase);

    app.use('/api/status', router);
};