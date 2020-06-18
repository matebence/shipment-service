module.exports = app => {
    const invoices = require("../controllers/invoices.controller");
    const router = require("express").Router();

    router.post("/", invoices.create.authorize, invoices.create.checkBody, invoices.create.validate, invoices.create.inDatabase);

    router.delete("/:id", invoices.delete.authorize, invoices.delete.validate, invoices.delete.inDatabase);

    router.put("/:id", invoices.update.authorize, invoices.update.checkBody, invoices.update.validate, invoices.update.inDatabase);

    router.get("/:id", invoices.get.authorize, invoices.get.validate, invoices.get.inDatabase);

    router.get("/page/:pageNumber/limit/:pageSize", invoices.getAll.authorize, invoices.getAll.validate, invoices.getAll.inDatabase);

    router.post("/search", invoices.search.authorize, invoices.search.checkBody, invoices.search.inDatabase);

    router.post("/join/:columnName", invoices.join.authorize, invoices.join.checkBody, invoices.join.validate, invoices.join.inDatabase);

    app.use('/api/invoices', router);
};