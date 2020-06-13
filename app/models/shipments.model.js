module.exports = (mongoose, schema, model) => {
    const mailer = require('../component/nodemailer.component');
    const mongooseDelete = require('mongoose-delete');

    let preShipment, postShipment;
    const shipmentSchema = new schema({
            courierId: {
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
            price: {
                type: Number,
                required: true
            },
            express: {
                type: Boolean,
                required: true
            },
            confirmed: {
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

    shipmentSchema.pre('findOneAndUpdate', async function () {
        preShipment = await this.model.findOne(this.getQuery()).populate({path:"status", model:"status"});
    });
    shipmentSchema.post('findOneAndUpdate', async function () {
        postShipment = await this.model.findOne(this.getQuery()).populate({path:"status", model:"status"});
        if (!preShipment.status._id.equals(postShipment.status._id)) mailer.sendHTMLMaile(
            "./resources/templates/shipmentNotification.ejs",
            {shipmentStatus: postShipment.status.name},
            {to: "m.bence05@gmail.com",
             subject: 'Zmena stavu zásielky'});
    });

    return model("shipments", shipmentSchema);
};