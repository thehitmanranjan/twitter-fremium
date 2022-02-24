const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var tweetSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    folderName: {
        type: String,
        required: true
    },
    tweetUrl : {
        type: String,
        required: true
    }
},{
    timestamps: true //This will add createtAt and updatedAt timestamp
});

var Tweets = mongoose.model('Tweets', tweetSchema);

module.exports = Tweets;