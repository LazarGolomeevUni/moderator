const express = require('express');
const axios = require('axios');
const app = express();

const { createPool } = require("mysql");
app.use(express.json())

var amqp = require('amqplib/callback_api');
var queue = 'rpc_queue';
var consumedChannel = '';
const pool = createPool({
    host: "thelibraryclub.cwahxov3y8ow.eu-north-1.rds.amazonaws.com",
    user: "lazar",
    password: "thelibraryclub"
})

amqp.connect('amqps://rsaictxm:WL_JjhXfSmLKSyTKQDlLGxKhCr70pbFv@rat.rmq2.cloudamqp.com/rsaictxm', function (error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function (error1, channel) {
        if (error1) {
            throw error1;
        }
        consumedChannel = channel;
        

        channel.assertQueue(queue, {
            durable: false
        });
        channel.prefetch(1);
        console.log(' [x] Awaiting RPC requests');
    });
});

app.get('/queue', (req, res) => {
    const user = JSON.parse(req.headers['user']);
    consumedChannel.get(queue, { noAck: false }, function (err, msg) {
        if (err) {
            throw err;
        }
        if (msg) {
            let postId = parseInt(msg.content.toString());
            consumedChannel.nack(msg, false, true);
            pool.query(`select * from postsdb.posts where id=${postId}`, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    posts = result;

                    res.json(posts);
                }
            })

            console.log("Post ID", postId);
        } else {
            console.log('No messages in the queue');
            res.send("No messages in the queue")
        }
    });
});

app.post('/', (req, res) => {
    const user = JSON.parse(req.headers['user']);
    consumedChannel.get(queue, { noAck: false }, function (err, msg) {
        if (err) {
            throw err;
        }
        if (msg) {
            let postId = req.body.id
            if (postId) {
                const status = req.body.status
                const array = [postId, user.id, status]
                const message = JSON.stringify(array)
                console.log(status)
                consumedChannel.sendToQueue(
                    msg.properties.replyTo,
                    Buffer.from(message),
                    { correlationId: msg.properties.correlationId }
                );
                console.log(Buffer.from(message))

                consumedChannel.ack(msg);
            }

        } else {
            console.log('No messages in the queue');
        }
    });
    res.send("done");
});

app.use('/', (req, res, next) => {
    return res.status(200).json({ "msg": "Hello from Moderator" })
})

app.listen(8004, () => {
    console.log('Moderator is listening to port 8004')
})