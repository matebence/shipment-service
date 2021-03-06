module.exports = (mongoose, schema, model) => {
    const mongooseDelete = require('mongoose-delete');
    const invoicesSchema = new schema(
        {
            invoice: {
                type: String,
                required: true
            },
            account: {
                type: String,
                required: true,
            }
        },
        {collection: "invoices", timestamps: {createdAt: 'createdAt'}}
    ).plugin(mongooseDelete, {deletedAt: true});

    return model("invoices", invoicesSchema);
};