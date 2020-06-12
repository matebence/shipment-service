module.exports = (mongoose, schema, model) => {
    let preShipment, postShipment;
    const mongooseDelete = require('mongoose-delete');
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
    });

    return model("shipments", shipmentSchema);
};