var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10003 });
var dropRatio = 0.2;
var dropSum = 1;

wsSource.on('open', function open() {
    
});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
        dropSum += dropRatio;
        if (dropSum >= 1) {
            msg = JSON.parse(data);
            msg.Img = new Buffer(msg.Img).toString('base64');
            wsServer.broadcast(JSON.stringify(msg));
            console.log(msg.UTCTime);

            dropSum = 0;
        }
    }
});

wsSource.on('close', function close() {
    console.log('disconnected');
});

wsServer.on('connection', function connection(ws) {
    console.log('user connection. totoal users count=' + wsServer.clients.length);
    ws.on('close', function () {
        console.log('user disconnection. total users count=' + wsServer.clients.length);
    });
    ws.on('error', function (edata) {
        console.log('stderr: ' + edata);
    });
});
wsServer.broadcast = function broadcast(data) {
    wsServer.clients.forEach(function each(client) {
        client.send(data, function ack(error) {
            if (error)
                console.log(error);
        });
    });
};
