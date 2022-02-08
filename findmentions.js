const axios = require('axios');
require('dotenv').config();

const regEx = `@thehitmanranjan bookmark in [^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$`
const pattern = "@thehitmanranjan bookmark in "

const bearerToken = process.env.BEARER_TOKEN;
let respArray = []
const userId = process.env.USER_ID;
let url = `https://api.twitter.com/2/users/${userId}/mentions?max_results=10&tweet.fields=in_reply_to_user_id&expansions=referenced_tweets.id,author_id`;
let ans = null;
const variable = "tweet.fields"
const created_at = "created_at"

axios.get(url, {
    headers: {
        "authorization": `Bearer ${bearerToken}`
    }
}).then(response => {
    ans = response.data.data
    console.log(JSON.stringify(response.data))
    //filter_data(ans)
}).catch(err => {
    console.error("Error: ", err);
});

function filter_data(data) {
    let referenced_tweet_id
    let referenced_tweet_text
    let folder_name
    let pattern_starting_index

    for (mention in data) {
        //If mention doesn't have  referenced tweet, it means @bot_user_name is simply used without any quoted tweet or below a tweet.
        if (data[mention].referenced_tweets) {
            let referenced_tweet = data[mention].referenced_tweets

            /* If referenced tweet type == quoted and in reply_to_user_id == @bot_user_id then it means that the end-user has quoted tweet and asked to bookmark
               If referenced tweet type == replied_to and in reply_to_user_id == @bot_user_id then it means the end-user has replied to the bot's tweet which is invalid.
            */
            if ((referenced_tweet[0].type == "quoted" && data[mention].in_reply_to_user_id == "451944242") || ((referenced_tweet[0].type == "replied_to" && data[mention].in_reply_to_user_id != "451944242"))) {
                referenced_tweet_id = referenced_tweet[0].id
                //Last @ should be my user ID. and the comma should be written followed by my @my_id.
                referenced_tweet_text = data[mention].text
                referenced_tweet_author = data[mention].author_id
                referenced_tweet_text_lowercase = referenced_tweet_text.toLowerCase()
                if (referenced_tweet_text_lowercase.includes(pattern)) {
                    console.log("Refernced Tweet Text: ", referenced_tweet_text)
                    pattern_starting_index = referenced_tweet_text.indexOf(pattern)
                    folder_name = referenced_tweet_text.substring(pattern_starting_index + 29)
                    console.log("Author id: ", referenced_tweet_author)
                    console.log("Folder Name:", folder_name)
                    console.log("Tweet URL:", "https://www.twitter.com/anyuser/status/" + referenced_tweet_id)
                }
                else {
                    console.log("Incorrect invoking pattern")
                }
            }
            //edge case is that you want to bookmark a tweet from the bot account itself.
            else {
                console.log("This is not a tagged reply")
            }
        }
        else {
            console.log("Invalid mention")
        }
    }
}