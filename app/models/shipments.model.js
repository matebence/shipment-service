module.exports = (mongoose, schema, model) => {
    const Accounts = require('../component/resilient.component');
    const mailer = require('../component/nodemailer.component');
    const mongooseDelete = require('mongoose-delete');

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
        // const proxy = Accounts.resilient("PARCEL-SERVICE");
        // proxy.post('/parcels/join/id', {data: [docs.pop().parcelId]}).then(response => {
        //     console.log(response.data);
        // })
    });

    shipmentSchema.pre('findOneAndUpdate', async function () {
        preShipment = await this.model.findOne(this.getQuery()).populate({path:"status", model:"status"});
    });

    shipmentSchema.post('findOneAndUpdate', async function () {
        postShipment = await this.model.findOne(this.getQuery()).populate({path:"status", model:"status"});
        if (preShipment.status._id.equals(postShipment.status._id)) return;
        const proxy = Accounts.resilient("PARCEL-SERVICE");
        proxy.post('/parcels/join/id', {data: [postShipment.parcelId]}).then(response => {
            if (response.status < 300) mailer.sendHTMLMaile("./resources/templates/shipmentNotification.ejs", {shipmentStatus: postShipment.status.name}, {to: response.data.pop().sender.email, subject: 'Zmena stavu zásielky'});
        })
    });

    return model("shipments", shipmentSchema);
};