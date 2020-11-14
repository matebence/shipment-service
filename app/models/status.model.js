module.exports = (mongoose, schema, model) => {
    const mongooseDelete = require('mongoose-delete');
    const statusSchema = new schema(
        {
            name: {
                type: String,
                required: true
            }
        },
        {collection: "status", timestamps: {createdAt: 'createdAt'}}
    ).plugin(mongooseDelete, {deletedAt: true});

    return model("status", statusSchema);
};