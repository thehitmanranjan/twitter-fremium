const needle = require('needle');
const mongoose = require('mongoose');
require('dotenv').config();

const Users = require('./models/user')
const Tweets = require('./models/tweet')
const token = process.env.BEARER_TOKEN;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream?expansions=referenced_tweets.id,author_id';
let tweet_author
let tweet_url
let folder_name

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

// Edit rules as desired below
const rules = [{
    'value': '"@BookmarkThisIn" (has:mentions OR is:quote)',
    'tag': 'savebookmark'
}
];

async function getAllRules() {

    const response = await needle('get', rulesURL, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}

async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}

async function setRules() {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return (response.body);

}

function streamConnect(retryAttempt) {

    const stream = needle.get(streamURL, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);

            tweet_author = json.data.author_id
            tweet_url = "https://www.twitter.com/anyuser/status/" + json.data.referenced_tweets[0].id;
            const tweet_text = json.data.text

            const last_index_of_quote = tweet_text.lastIndexOf("@")
            folder_name = tweet_text.substring(last_index_of_quote + 16)

            console.log("Author: ", tweet_author)
            console.log("Tweet URL: ", tweet_url)
            console.log("Folder Name: ", folder_name)

            bookmarkTweet(tweet_author, folder_name, tweet_url)
            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream. 
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });

    return stream;

}


(async () => {
    let currentRules;

    try {
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();

        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    // Listen to the stream.
    streamConnect(0);
})();
function bookmarkTweet(authorID, folderName, tweetUrl) {
    console.log("Inside Function")
    const url = process.env.MONGO_URL;
    const connect = mongoose.connect(url);

    connect.then((db) => {
        console.log("Connected correctly to server");
    }, (err) => { console.log(err); });

    const userId = {
        "userId": authorID
    }
    const tweet = {
        "userId": authorID,
        "folderName": folderName,
        "tweetUrl": tweetUrl
    }

    Users.findOneAndUpdate(userId, userId, {
        new: true,
        upsert: true // Make this update into an upsert
    }, (err) => {
        if (err) {
            console.log(err)
        }
    });

    Tweets.findOneAndUpdate(tweet, tweet, {
        upsert: true // Make this update into an upsert
    }, (err) => {
        if (err) {
            console.log(err)
        }
    });
    replyToTweet()
}

function replyToTweet() {
    const Twit = require('twit');

    // Replace these values with your own Twitter API keys
    const T = new Twit({
        consumer_key: 'bw4Zc4xLZFEC4nfMNwV3eslJc',
        consumer_secret: 'ccDzhwHljym9V99Bql12r9Qilggv3kXpNg3NMvyMQm3DDS5oxR',
        access_token: '451944242-aDhVC9OqG1ij8horLHpiWx6rHme6UCddCN680Au0',
        access_token_secret: 'ZrUKZkzCynNNK26onKNj1pol2LR0YnXufAf71A2DIAOg3'
    });

    // The tweet you want to reply to
    const tweetId = '1602678852933029889';

    // The text of your reply
    const replyText = 'This is my reply!';

    T.post('statuses/update', {
        status: replyText,
        in_reply_to_status_id: tweetId
    }, (err, data, response) => {
        // console.log({err});
        // console.log({response});
        console.log("Replied")
    });

}