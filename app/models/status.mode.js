module.exports = (mongoose, schema, model) => {
    const mongooseDelete = require('mongoose-delete');
    return model("status", new schema(
        {
            name: {
                type: String,
                required: true,
                unique: true
            }
        },
        {collection: "status", timestamps: {createdAt: 'createdAt'}}
    ).plugin(mongooseDelete, {deletedAt: true}));
};