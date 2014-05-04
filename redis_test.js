    // var redis = require("redis"),
    //     client = redis.createClient(6379, "192.168.2.8");

    // // if you'd like to select database 3, instead of 0 (default), call
    // // client.select(3, function() { /* ... */ });

    // client.on("error", function(err) {
    //     console.log("Error " + err);
    // });

    // client.set("string key1", "string val1", redis.print);
    // client.get("foo", function(err, result) {
    //     // console.log(result);
    //     if (result == null) {
    //         console.log("result is null");

    //     } else {
    //         console.log("result is not null");

    //     }
    // });

    // client.hset("hash key", "hashtest 1", "some value", redis.print);
    // client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    // client.hkeys("hash key", function(err, replies) {
    //     console.log(replies.length + " replies:");
    //     replies.forEach(function(reply, i) {
    //         console.log("    " + i + ": " + reply);
    //     });
    //     client.quit();
    // });

    // var tagManager = require('./lib/redis_model/tag');
    // var tag1 = {
    //     name: 'good3',
    //     count: 3
    // }, tag2 = {
    //         name: 'bad2',
    //         count: 2
    //     },
    //     tags = [tag1, tag2];
    // tagManager.update(tags);

    var tagWordManager = require('./lib/redis_model/tag_word');
    var word1 = {
        content: 'fuck',
        tag_name: 'Ipsum8',
        count: 3
    }, word2 = {
            content: 'fuck',
            tag_name: 'you',
            count: 2
        },
        words = [word1, word2];
    tagWordManager.update(words);

    // console.log("1"*1+1);