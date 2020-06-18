module.exports = (app, config) => {
    const nodemailer = require('nodemailer');
    const ejs = require("ejs");

    const transport = nodemailer.createTransport({
        host: config.get('node.mail.host'),
        port: config.get('node.mail.port')
    });

    module.exports = {
        sendHTMLMaile: (file, variables, account) => {
            ejs.renderFile(`${global.appRoot}/resources/templates/${file}`, variables, (err, data) => {
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
        sendAttchMaile: (file, invoice, content, account) => {
            ejs.renderFile(`${global.appRoot}/resources/templates/${file}`, (err, data) => {
                if (err) return false;
                transport.sendMail({
                    from: config.get('blesk.nodemailer.from'),
                    html: data,
                    ...account,
                    attachments: [{
                        filename: invoice,
                        path: `${global.appRoot}/public/invoices/${invoice}`,
                        contentType: content
                    }]
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