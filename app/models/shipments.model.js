module.exports = (mongoose, schema, model) => {
    const mongooseDelete = require('mongoose-delete');
    const crypto = require('crypto-js');

    const Invoices = mongoose.model('invoices');

    const Accounts = require('../component/resilient.component');
    const mailer = require('../component/nodemailer.component');
    const {invoice} = require("../../app/component/pdfkit.component");

    let preShipment, postShipment;
    const shipmentSchema = new schema({
            courier: {
                type: Number,
                required: true
            },
            parcelId: {
                type: Number,
                required: true
            },
            from: {
                type: String,
                required: true,
            },
            to: {
                type: String,
                required: true,
            },
            status: {
                type: schema.Types.ObjectId,
                ref: "status",
                required: true
            },
            invoice: {
                type: schema.Types.ObjectId,
                ref: "invoices",
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            express: {
                type: Boolean,
                required: true
            },
            startDate: {
                type: String,
            },
            endDate: {
                type: String,
            }
        },
        {collection: "shipments", timestamps: {createdAt: 'createdAt'}}
    ).plugin(mongooseDelete, {deletedAt: true});

    shipmentSchema.pre('insertMany', async function (next, docs) {
        const proxy = Accounts.resilient("PARCEL-SERVICE");
        proxy.post('/parcels/join/id', {data: [docs[0].parcelId]}).then(response => {
            if (response.status < 300) {
                const data = response.data.pop();
                const checksum = {id: 1, shipments: docs, sender: data.sender};
                const name = `${crypto.MD5(data.sender.name + data.sender.senderId).toString()}.pdf`;

                docs.map(e => e.invoice = name);

                Invoices({invoice: name}).save().then(result => { if (!result) return;
                    invoice.init(checksum, name).addHeader().addCustomerDetails().createTable();
                    mailer.sendAttchMaile("invoiceNotification.ejs", name, 'application/pdf', {
                        to: data.sender.email,
                        subject: 'Blesk s.r.o. faktúra'
                    });
                });
            }
        })
    });

    shipmentSchema.post('findOneAndUpdate', async function () {
        postShipment = await this.model.findOne(this.getQuery()).populate({path: "status", model: "status"});
        if (preShipment.status._id.equals(postShipment.status._id)) return;

        const proxy = Accounts.resilient("PARCEL-SERVICE");
        proxy.post('/parcels/join/id', {data: [postShipment.parcelId]}).then(response => {
            if (response.status < 300) {
                mailer.sendHTMLMaile("shipmentNotification.ejs", {shipmentStatus: postShipment.status.name}, {
                    to: response.data.pop().sender.email,
                    subject: 'Zmena stavu zásielky'
                });
            }
        })
    });

    shipmentSchema.pre('findOneAndUpdate', async function () {
        preShipment = await this.model.findOne(this.getQuery()).populate({path: "status", model: "status"});
    });

    return model("shipments", shipmentSchema);
};