const {validationResult, check} = require('express-validator/check');

const strings = require('../../resources/strings');
const database = require("../models");

const Shipments = database.shipments;

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_NUMBER = 1;

exports.create = {
    authorize: (req, res, next) => {
        next();
    },
    checkBody: (req, res, next) => {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                message: strings.SERVER_REQUEST_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next();
    },
    validate: [
        check('courierId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_COURIER_ID_INT),
        check('parcelId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PARCEL_ID_INT),
        check('from')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_FROM_LENGHT)
            .isAscii(['sk-SK']).withMessage(strings.SHIPMENT_FROM_ASCII),
        check('to')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_TO_LENGHT)
            .isAscii(['sk-SK']).withMessage(strings.SHIPMENT_TO_ASCII),
        check('statusId')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('price')
            .isFloat({min: 1.00}).withMessage(strings.SHIPMENT_PRICE_FLOAT),
        check('express')
            .isBoolean().withMessage(strings.SHIPMENT_EXPRESS_BOOLEAN),
        check('confirmed')
            .isBoolean().withMessage(strings.SHIPMENT_CONFIRMED_BOOLEAN),
        check('startDate')
            .matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),
        check('endDate')
            .matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SERVER_VALIDATION_ERR,
                    error: true,
                    validations: errors.array(),
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
            next()
        }
    ],
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments(req.body).save()]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(201).json(data, [
                        {rel: "shipment", method: "GET", href: `${req.protocol}://${req.get('host')}/api/shipments/${data._id}`}]);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                });
                throw strings.CREATE_SHIPMENT_ERR;
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.CREATE_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.delete = {
    authorize: (req, res, next) => {
        next();
    },
    validate: [
        check('id')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SERVER_VALIDATION_ERR,
                    error: true,
                    validations: errors.array(),
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
            next()
        }
    ],
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments.delete({_id: database.mongoose.Types.ObjectId(req.params.id), deleted: false})]).then(([session, data]) => {
            session.startTransaction();
            if (data.n === 1) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json({});
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(400).json({
                        timestamp: new Date().toISOString(),
                        message: strings.GET_SHIPMENT_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.DELETE_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.update = {
    authorize: (req, res, next) => {
        next();
    },
    checkBody: (req, res, next) => {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                message: strings.SERVER_REQUEST_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next();
    },
    validate: [
        check('id')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('courierId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_COURIER_ID_INT),
        check('parcelId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PARCEL_ID_INT),
        check('from')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_FROM_LENGHT)
            .isAscii(['sk-SK']).withMessage(strings.SHIPMENT_FROM_ASCII),
        check('to')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_TO_LENGHT)
            .isAscii(['sk-SK']).withMessage(strings.SHIPMENT_TO_ASCII),
        check('statusId')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('price')
            .isFloat({min: 1.00}).withMessage(strings.SHIPMENT_PRICE_FLOAT),
        check('express')
            .isBoolean().withMessage(strings.SHIPMENT_EXPRESS_BOOLEAN),
        check('confirmed')
            .isBoolean().withMessage(strings.SHIPMENT_CONFIRMED_BOOLEAN),
        check('startDate')
            .matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),
        check('endDate')
            .matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SERVER_VALIDATION_ERR,
                    error: true,
                    validations: errors.array(),
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
            next()
        }
    ],
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments.findByIdAndUpdate(req.params.id, req.body)]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json({});
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(500).json({
                        timestamp: new Date().toISOString(),
                        message: strings.UPDATE_SHIPMENT_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                message: strings.GET_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.get = {
    authorize: (req, res, next) => {
        next();
    },
    validate: [
        check('id')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SERVER_VALIDATION_ERR,
                    error: true,
                    validations: errors.array(),
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
            next()
        }
    ],
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments.findOne({_id: req.params.id, deleted: false }).populate({path:"statusId", model:"status"})]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json(data, [
                        {rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl},
                        {rel: "all-shipments", method: "GET", href: `${req.protocol}://${req.get('host')}/api/shipments/page/${DEFAULT_PAGE_NUMBER}/limit/${DEFAULT_PAGE_SIZE}`}]);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(400).json({
                        timestamp: new Date().toISOString(),
                        message: strings.GET_SHIPMENT_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.SHIPMENT_NOT_FOUND,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.getAll = {
    authorize: (req, res, next) => {
        next();
    },
    validate: [
        check('pageNumber')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PAGE_NUMBER_INT),
        check('pageSize')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PAGE_SIZE_INT),

        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SERVER_VALIDATION_ERR,
                    error: true,
                    validations: errors.array(),
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
            next()
        }
    ],
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments.find({deleted: false}).populate({path:"statusId", model:"status"}).sort('createdAt').skip((Number(req.params.pageNumber) - 1) * Number(req.params.pageSize)).limit(Number(req.params.pageSize))]).then(([session, data]) => {
            session.startTransaction();
            if (data.length > 0 || data !== undefined) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(206).json({data}, [
                        {rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl},
                        {rel: "next-range", method: "GET", href: `${req.protocol}://${req.get('host')}/api/shipments/page/${1 + Number(req.params.pageNumber)}/limit/${req.params.pageSize}`}]);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(400).json({
                        timestamp: new Date().toISOString(),
                        message: strings.SHIPMENT_NOT_FOUND,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.SHIPMENT_NOT_FOUND,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.search = {
    authorize: (req, res, next) => {
        next();
    },
    checkBody: (req, res, next) => {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                message: strings.SERVER_REQUEST_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next();
    },
    inDatabase: (req, res, next) => {
        const pagination = req.body.pagination;
        let order = req.body.orderBy;
        let search = req.body.search;
        let hateosLinks = [];

        if (order) {
            Object.keys(order).map(function (key, index) {
                if (order[key].toLowerCase() === 'asc') {
                    order[key] = 1;
                } else if (order[key].toLowerCase() === 'desc') {
                    order[key] = -1;
                }
            });
        }
        if (search) {
            Object.keys(search).map(function (key, index) {
                search[key] = {$regex: new RegExp("^.*" + search[key] + '.*', "i")}
            });
        }
        Shipments.countDocuments({deleted: false, ...search}, (err, count) => {
            hateosLinks.push({rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl});
            if (Number(pagination.pageNumber) > 1) hateosLinks.push({rel: "has-prev", method: "POST", href: `${req.protocol}://${req.get('host')}/api/shipments/search`});
            if ((Number(pagination.pageNumber) * Number(pagination.pageSize)) < count) hateosLinks.push({rel: "has-next", method: "POST", href: `${req.protocol}://${req.get('host')}/api/shipments/search`});
        });

        return Promise.all([Shipments.startSession(), Shipments.find({deleted: false, ...search}).populate({path:"statusId", model:"status"}).sort(order).skip((Number(pagination.pageNumber) - 1) * Number(pagination.pageSize)).limit(Number(pagination.pageSize))]).then(([session, data]) => {
            session.startTransaction();
            if (data.length > 0 || data !== undefined) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json({data}, hateosLinks);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(400).json({
                        timestamp: new Date().toISOString(),
                        message: strings.SHIPMENT_NOT_FOUND,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.SHIPMENT_NOT_FOUND,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};