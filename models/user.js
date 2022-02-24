const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var userSchema = new Schema({
    userId: {
        type: Number,
        required: true, //No two documents should have the same field.
    }
},{
    timestamps: true //This will add createtAt and updatedAt timestamp
});

var Users = mongoose.model('User', userSchema);

module.exports = Users;