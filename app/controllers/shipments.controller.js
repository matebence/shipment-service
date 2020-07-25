const {validationResult, check} = require('express-validator/check');
const crypto = require('crypto-js');

const strings = require('../../resources/strings');
const database = require("../models");

const Accounts = require('../component/resilient.component');
const Parcels = require('../component/resilient.component');
const Users = require('../component/resilient.component');

const Shipments = database.shipments;
const Prices = database.prices;

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_NUMBER = 1;

exports.create = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CLIENT'])) {
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
        check('shipments[*].courier')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_COURIER_ID_INT),
        check('shipments[*].parcelId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PARCEL_ID_INT),
        check('shipments[*].from')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_FROM_LENGHT)
            .matches(/^[\D ]+$/).withMessage(strings.SHIPMENT_FROM_MATHCES),
        check('shipments[*].to')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_TO_LENGHT)
            .matches(/^[\D ]+$/).withMessage(strings.SHIPMENT_TO_MATHCES),
        check('shipments[*].status')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('shipments[*].price')
            .isFloat({min: 1.00}).withMessage(strings.SHIPMENT_PRICE_FLOAT),
        check('shipments[*].express')
            .isBoolean().withMessage(strings.SHIPMENT_EXPRESS_BOOLEAN),
        check('shipments[*].startDate')
            .optional().matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),
        check('shipments[*].endDate')
            .optional().matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),

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
    addCompanyProfit: (req, res, next) => {
        Prices.findOne({_id: "5ef89dcd56f69d17643556e8"}).then(result => {
            req.body.shipments.forEach(e => {
                e.price += result.price;
                e.invoice = database.mongoose.Types.ObjectId()
            });
            next();
        }).catch(err => {
            return res.status(404).json({
                timestamp: new Date().toISOString(),
                message: strings.CREATE_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    },
    checkBalance: (req, res, next) => {
        const proxy = Parcels.resilient("PARCEL-SERVICE");
        const parcels = req.body.shipments[0];

        proxy.post('/parcels/join/id', {data: [parcels.parcelId]}).then(response => {
            if (response.status >= 300 && !'error' in response.data) return new Error(strings.PROXY_ERR);
            database.redis.setex(crypto.MD5(`parcels-${parcels.parcelId}`).toString(), 3600, JSON.stringify(response.data));
            const sender = response.data.pop().sender;
            if (Number(sender.balance) >= Number(parcels.price)){
                req.body.sender = {
                    senderId: sender.senderId,
                    actualBalance: Number(sender.balance) - Number(parcels.price)
                };
                next()
            }else{
                return res.status(422).json({
                    timestamp: new Date().toISOString(),
                    message: strings.CREATE_SHIPMENT_ERR,
                    error: true,
                    nav: `${req.protocol}://${req.get('host')}`
                });
            }
        }).catch(err => {
            return res.status(500).json({
                timestamp: new Date().toISOString(),
                message: strings.CREATE_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    },
    updateUserBalance: (req, res, next) => {
        const proxy = Users.resilient("USER-SERVICE");
        proxy.get(`/users/${req.body.sender.senderId}`).then(response => {
            if (response.status >= 300 && !'error' in response.data) return new Error(strings.PROXY_ERR);
            const user = response.data;
            user.balance = req.body.sender.actualBalance;
            proxy.put(`/users/${req.body.sender.senderId}`, {data: user}).then(response => {
                if (Number(response.status) === 204) next();
                return new Error(strings.PROXY_ERR);
            }).catch(err => {
                return res.status(500).json({
                    timestamp: new Date().toISOString(),
                    message: strings.CREATE_SHIPMENT_ERR,
                    error: true,
                    nav: `${req.protocol}://${req.get('host')}`
                });
            });
        }).catch(err => {
            return res.status(404).json({
                timestamp: new Date().toISOString(),
                message: strings.CREATE_SHIPMENT_ERR,
                error: true,
                nav: `${req.protocol}://${req.get('host')}`
            });
        });
    },
    inDatabase: (req, res, next) => {
        return Promise.all([Shipments.startSession(), Shipments.insertMany(req.body.shipments)]).then(([session, data]) => {
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
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_COURIER', 'ROLE_CLIENT'])) {
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
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('courier')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_COURIER_ID_INT),
        check('parcelId')
            .isInt({min: 1}).withMessage(strings.SHIPMENT_PARCEL_ID_INT),
        check('from')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_FROM_LENGHT)
            .matches(/^[\D ]+$/).withMessage(strings.SHIPMENT_FROM_MATHCES),
        check('to')
            .isLength({min: 3, max: 64}).withMessage(strings.SHIPMENT_TO_LENGHT)
            .matches(/^[\D ]+$/).withMessage(strings.SHIPMENT_TO_MATHCES),
        check('status')
            .isMongoId().withMessage(strings.SHIPMENT_MONGO_ID),
        check('price')
            .isFloat({min: 1.00}).withMessage(strings.SHIPMENT_PRICE_FLOAT),
        check('express')
            .isBoolean().withMessage(strings.SHIPMENT_EXPRESS_BOOLEAN),
        check('startDate')
            .optional().matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),
        check('endDate')
            .optional().matches(/^[2020-9999]{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])T[0-23]{2}:[0-59]{2}:[0-59]{2}.\d+Z$/).withMessage(strings.SHIPMENT_DATE),

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
        return Promise.all([Shipments.startSession(), Shipments.findOneAndUpdate({_id: req.params.id}, req.body)]).then(([session, data]) => {
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
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_COURIER', 'ROLE_CLIENT'])) {
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
        return Promise.all([Shipments.startSession(), Shipments.findOne({_id: req.params.id, deleted: false}).populate({path: "status", model: "status"}).populate({path: "invoice", model: "invoices"})]).then(([session, data]) => {
            session.startTransaction();
            if (data) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    req.shipments = data;
                    req.hateosLinks = [{rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl},
                        {rel: "all-shipments", method: "GET", href: `${req.protocol}://${req.get('host')}/api/shipments/page/${DEFAULT_PAGE_NUMBER}/limit/${DEFAULT_PAGE_SIZE}`}];
                    next();
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
    },
    fetchDataFromService: (req, res, next) => {
        const proxy = Accounts.resilient("ACCOUNT-SERVICE");
        const accounts = req.shipments.courier;

        proxy.post('/accounts/join/accountId', {data: {ids: [accounts]}}).then(response => {
            if (response.status >= 300 && !'error' in response.data) return new Error(strings.PROXY_ERR);
            database.redis.setex(crypto.MD5(`accounts-${accounts}`).toString(), 3600, JSON.stringify(response.data));

            const shipments = [req.shipments].map(e => {
                const {userName, email} = response.data.find(x => x.accountId === e.courier);
                return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
            }).pop();

            return res.status(200).json(shipments, req.hateosLinks);
        }).catch(err => {
            req.cacheId = accounts;
            next();
        });
    },
    fetchDataFromCache: (req, res, next) => {
        database.redis.get(crypto.MD5(`accounts-${req.cacheId}`).toString(), (err, data) => {
            if (!data) {
                return res.status(500).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SHIPMENT_NOT_FOUND,
                    error: true,
                    nav: `${req.protocol}://${req.get('host')}`
                });
            } else{
                try{
                    const shipments = [req.shipments].map(e => {
                        const {userName, email} = JSON.parse(data).find(x => x.accountId === e.courier);
                        return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
                    }).pop();

                    return res.status(200).json(shipments, req.hateosLinks);
                }catch(err){
                    return res.status(500).json({
                        timestamp: new Date().toISOString(),
                        message: strings.SHIPMENT_NOT_FOUND,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                }
            }
        });
    }
};

exports.getAll = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_COURIER', 'ROLE_CLIENT'])) {
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
        return Promise.all([Shipments.startSession(), Shipments.find({deleted: false}).populate({path: "status", model: "status"}).populate({path: "invoice", model: "invoices"}).sort('createdAt').skip((Number(req.params.pageNumber) - 1) * Number(req.params.pageSize)).limit(Number(req.params.pageSize))]).then(([session, data]) => {
            session.startTransaction();
            if (data.length > 0 || data !== undefined) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    req.shipments = data;
                    req.hateosLinks = [{rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl},
                        {rel: "next-range", method: "GET", href: `${req.protocol}://${req.get('host')}/api/shipments/page/${1 + Number(req.params.pageNumber)}/limit/${req.params.pageSize}`}];
                    next();
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
    },
    fetchDataFromService: (req, res, next) => {
        const proxy = Accounts.resilient("ACCOUNT-SERVICE");
        const accounts = req.shipments.filter(e => e.courier).map(x => x.courier);

        proxy.post('/accounts/join/accountId', {data: {ids: accounts}}).then(response => {
            if (response.status >= 300 && !'error' in response.data) return new Error(strings.PROXY_ERR);
            response.data.forEach(e => {database.redis.setex(crypto.MD5(`accounts-${e.accountId}`).toString(), 3600, JSON.stringify(e))});

            const shipments = req.shipments.map(e => {
                const {userName, email} = response.data.find(x => x.accountId === e.courier);
                return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
            });

            return res.status(206).json({data: shipments}, req.hateosLinks);
        }).catch(err => {
            req.cacheId = accounts;
            next();
        });
    },
    fetchDataFromCache: (req, res, next) => {
        database.redis.mget(req.cacheId.map(e => {return crypto.MD5(`accounts-${e}`).toString()}), (err, data) => {
            if (!data) {
                return res.status(500).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SHIPMENT_NOT_FOUND,
                    error: true,
                    nav: `${req.protocol}://${req.get('host')}`
                });
            } else {
                try{
                    data = JSON.stringify(data.map(e => {return JSON.parse(e)}));
                    const shipments = req.shipments.map(e => {
                        const {userName, email} = JSON.parse(data).find(x => x.accountId === e.courier);
                        return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
                    });

                    return res.status(206).json({data: shipments}, req.hateosLinks);
                } catch(err) {
                    return res.status(500).json({
                        timestamp: new Date().toISOString(),
                        message: strings.SHIPMENT_NOT_FOUND,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                }
            }
        });
    }
};

exports.search = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_COURIER', 'ROLE_CLIENT'])) {
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
                if(isNaN(search[key]) &&  new RegExp("^[0-9a-fA-F]{24}$").test(search[key])){
                    search[key] = database.mongoose.Types.ObjectId(search[key])
                } else if (isNaN(search[key])){
                    search[key] = {$regex: new RegExp("^.*" + search[key] + '.*', "i")}
                }
            });
        }
        Shipments.countDocuments({deleted: false, ...search}, (err, count) => {
            hateosLinks.push({rel: "self", method: "GET", href: req.protocol + '://' + req.get('host') + req.originalUrl});
            if (Number(pagination.pageNumber) > 1) hateosLinks.push({rel: "has-prev", method: "POST", href: `${req.protocol}://${req.get('host')}/api/shipments/search`});
            if ((Number(pagination.pageNumber) * Number(pagination.pageSize)) < count) hateosLinks.push({rel: "has-next", method: "POST", href: `${req.protocol}://${req.get('host')}/api/shipments/search`});
        });

        return Promise.all([Shipments.startSession(), Shipments.find({deleted: false, ...search}).populate({path: "status", model: "status"}).populate({path: "invoice", model: "invoices"}).sort(order).skip((Number(pagination.pageNumber) - 1) * Number(pagination.pageSize)).limit(Number(pagination.pageSize))]).then(([session, data]) => {
            session.startTransaction();
            if (data.length > 0 || data !== undefined) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    req.shipments = data;
                    req.hateosLinks = hateosLinks;
                    next();
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
    },
    fetchDataFromService: (req, res, next) => {
        const proxy = Accounts.resilient("ACCOUNT-SERVICE");
        const accounts = req.shipments.filter(e => e.courier).map(x => x.courier);

        proxy.post('/accounts/join/accountId', {data: {ids: accounts}}).then(response => {
            if (response.status >= 300 && !'error' in response.data) return new Error(strings.PROXY_ERR);
            response.data.forEach(e => {database.redis.setex(crypto.MD5(`accounts-${e.accountId}`).toString(), 3600, JSON.stringify(e))});

            const shipments = req.shipments.map(e => {
                const {userName, email} = response.data.find(x => x.accountId === e.courier);
                return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
            });

            return res.status(200).json({data: shipments}, req.hateosLinks);
        }).catch(err => {
            req.cacheId = accounts;
            next();
        });
    },
    fetchDataFromCache: (req, res, next) => {
        database.redis.mget(req.cacheId.map(e => {return crypto.MD5(`accounts-${e}`).toString()}), (err, data) => {
            if (!data) {
                return res.status(500).json({
                    timestamp: new Date().toISOString(),
                    message: strings.SHIPMENT_NOT_FOUND,
                    error: true,
                    nav: `${req.protocol}://${req.get('host')}`
                });
            } else {
                try {
                    data = JSON.stringify(data.map(e => {return JSON.parse(e)}));
                    const shipments = req.shipments.map(e => {
                        const {userName, email} = JSON.parse(data).find(x => x.accountId === e.courier);
                        return {...e._doc, courier: {courierId: e.courier, userName: userName, email: email}};
                    });

                    return res.status(200).json({data: shipments}, req.hateosLinks);
                } catch(err){
                    return res.status(500).json({
                        timestamp: new Date().toISOString(),
                        message: strings.SHIPMENT_NOT_FOUND,
                        error: true,
                        nav: `${req.protocol}://${req.get('host')}`
                    });
                }
            }
        });
    }
};

exports.join = {
    authorize: (req, res, next) => {
        if (!req.hasRole(['ROLE_SYSTEM'])) {
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
        next()
    },
    validate: [
        check('columnName')
            .matches(/^_|[a-zA-Z]+$/).withMessage(strings.SHIPMENT_COLUMN_NAME_MATCHES),

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
        let ids = {[`${req.params.columnName}`]: {$in: []}};
        if (req.body) {
            for (const element of req.body) {
                req.params.columnName === "_id"?ids[`${req.params.columnName}`].$in.push(database.mongoose.Types.ObjectId(element)):ids[`${req.params.columnName}`].$in.push(element)
            }
        }

        return Promise.all([Shipments.startSession(), Shipments.find({deleted: false, ...ids}).populate({path: "status", model: "status"}).populate({path: "invoice", model: "invoices"})]).then(([session, data]) => {
            session.startTransaction();
            if (data.length > 0 || data !== undefined) {
                session.commitTransaction().then(() => {
                    session.endSession();
                    return res.status(200).json(data);
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