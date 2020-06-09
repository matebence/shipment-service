const {validationResult, check} = require('express-validator/check');

const strings = require('../../resources/strings');
const database = require("../models");

const Shipments = database.shipments;

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_NUMBER = 1;

exports.create = {
    authorize: (req, res, next) => {
    },
    checkBody: (req, res, next) => {
    },
    validate: [
    ],
    inDatabase: (req, res, next) => {
    }
};

exports.delete = {
    authorize: (req, res, next) => {
    },
    validate: [
    ],
    inDatabase: (req, res, next) => {
    }
};

exports.update = {
    authorize: (req, res, next) => {
    },
    checkBody: (req, res, next) => {
    },
    validate: [
    ],
    inDatabase: (req, res, next) => {
    }
};

exports.get = {
    authorize: (req, res, next) => {
    },
    validate: [
    ],
    inDatabase: (req, res, next) => {
    }
};

exports.getAll = {
    authorize: (req, res, next) => {
    },
    validate: [
    ],
    inDatabase: (req, res, next) => {
    }
};

exports.search = {
    authorize: (req, res, next) => {
    },
    checkBody: (req, res, next) => {
    },
    inDatabase: (req, res, next) => {
    }
};