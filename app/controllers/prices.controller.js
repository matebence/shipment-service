const {validationResult, check} = require('express-validator/check');

const strings = require('../../resources/strings');
const database = require("../models");

const Prices = database.prices;

exports.create = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER'])) {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                message: strings.AUTH_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next()
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
        check('price')
            .isFloat({min: 1.00}).withMessage(strings.PRICES_PRICE_FLOAT),

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
        return Promise.all([Prices.startSession(), Prices(req.body).save()]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(201).json(data, [
                        {rel: "price", method: "GET", href: `${req.protocol}://${req.get('host')}/api/prices/${data._id}`}]);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                });
                throw strings.CREATE_PRICE_ERR;
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.CREATE_PRICE_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.delete = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER'])) {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                message: strings.AUTH_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next()
    },
    validate: [
        check('id')
            .isMongoId().withMessage(strings.PRICE_MONGO_ID),

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
        return Promise.all([Prices.startSession(), Prices.delete({_id: database.mongoose.Types.ObjectId(req.params.id), deleted: false})]).then(([session, data]) => {
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
                        message: strings.GET_PRICE_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.DELETE_PRICE_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.update = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER'])) {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                message: strings.AUTH_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next()
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
            .isMongoId().withMessage(strings.PRICE_MONGO_ID),
        check('price')
            .isFloat({min: 1.00}).withMessage(strings.PRICES_PRICE_FLOAT),

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
        return Promise.all([Prices.startSession(), Prices.findOneAndUpdate({_id: req.params.id}, req.body)]).then(([session, data]) => {
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
                        message: strings.UPDATE_PRICE_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                message: strings.GET_PRICE_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};

exports.get = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER'])) {
            return res.status(401).json({
                timestamp: new Date().toISOString(),
                message: strings.AUTH_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        }
        next()
    },
    validate: [
        check('id')
            .isMongoId().withMessage(strings.PRICE_MONGO_ID),

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
        return Promise.all([Prices.startSession(), Prices.findOne({_id: req.params.id, deleted: false })]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json(data, [
                        {rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl}]);
                });
            } else {
                session.abortTransaction().then(() => {
                    session.endSession();
                    return res.status(400).json({
                        timestamp: new Date().toISOString(),
                        message: strings.GET_PRICE_ERR,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.PRICE_NOT_FOUND,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    }
};