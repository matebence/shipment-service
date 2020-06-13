module.exports = (app, config) => {
    const nodemailer = require('nodemailer');
    const ejs = require("ejs");

    const transport = nodemailer.createTransport({
        host: config.get('node.mail.host'),
        port: config.get('node.mail.port')
    });

    module.exports = {
        sendHTMLMaile: (file, variables, account) => {
            ejs.renderFile(file, variables, (err, data) => {
                if (err) return false;
                transport.sendMail({
                    from: config.get('blesk.nodemailer.from'),
                    html: data,
                    ...account
                }, (err) => {
                    return !err;
                });
            });
        },
        sendTXTMaile: (account) => {
            transport.sendMail({
                from: config.get('blesk.nodemailer.from'),
                ...account
            }, (err) => {
                return !err;
            });
        }
    };
};