const express = require('express');

const app = express();

app.use(express.json())

var amqp = require('amqplib/callback_api');
var queue = 'rpc_queue';
var consumedChannel = '';

amqp.connect('amqps://pepqwzfo:QdtFkPU3RuBGMfsFlMiXPlI0JylxB1nu@rat.rmq2.cloudamqp.com/pepqwzfo', function (error0, connection) {
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

app.post('/', (req, res) => {
    const user = JSON.parse(req.headers['user']);
    consumedChannel.get(queue, { noAck: false }, function (err, msg) {
        if (err) {
            throw err;
        }
        if (msg) {
            let postId = parseInt(msg.content.toString());

            console.log(" [.] fib(%d)", postId);
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