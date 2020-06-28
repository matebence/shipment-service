module.exports = (mongoose, schema, model) => {
    const mongooseDelete = require('mongoose-delete');
    const priceSchema = new schema(
        {
            price: {
                type: Number,
                required: true,
                defaultValue: 1.50
            }
        },
        {collection: "prices", timestamps: {createdAt: 'createdAt'}}
    ).plugin(mongooseDelete, {deletedAt: true});

    return model("prices", priceSchema);
};