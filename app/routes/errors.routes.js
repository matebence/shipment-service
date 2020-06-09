module.exports = app => {
    const strings = require('../../resources/strings');

    app.get('*', (req, res) => {
        res.status(404).json({
            timestamp: new Date().toISOString(),
            message: strings.SERVER_PAGE_NOT_FOUND,
            error: true,
            nav: req.protocol + '://' + req.get('host')
        });
    });
};