var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource1 = new WebSocket('ws://localhost:9999');
var wsSource2 = new WebSocket('ws://localhost:9998');
var wsServer = new WebSocketServer({ port: 10000 });
var gm = require('gm');
var lastImageBuf1, lastImageBuf2;
var interval = 100; // ms

wsSource1.on('open', function open() {
});
wsSource2.on('open', function open() {
});

wsSource1.on('message', function (data, flags) {
    //if (wsServer.clients.length > 0) { // 有人連進來才處理
        var msg = JSON.parse(data);
        lastImageBuf1 = new Buffer(msg.Img);
        gm(lastImageBuf1).write('/1.png', function (err) {
            if (!err) console.log("Written composite image.");
        });
        console.log("img1 " + lastImageBuf1.length);
    //}
});
wsSource2.on('message', function (data, flags) {
    //if (wsServer.clients.length > 0) { // 有人連進來才處理
        var msg = JSON.parse(data);
        lastImageBuf2 = new Buffer(msg.Img);
        gm(lastImageBuf2).write('/2.png', function (err) {
            if (!err) console.log("Written composite image.");
        });
        console.log("img2 " + lastImageBuf2.length);        
    //}
});

wsSource1.on('close', function close() {
    console.log('disconnected');
});
wsSource2.on('close', function close() {
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

function mix() {
    if (lastImageBuf1 && lastImageBuf2) {
        gm('/1.png').append('/2.png', true).write('/composite.png', function (err) {
            if(!err) console.log("Written composite image.");
        });
        //gm(lastImageBuf1, 'img1.jpg').append(lastImageBuf2, 'img2.jpg').append().toBuffer('JPG', function (err, buffer) {
        //    if (err)
        //        console.log(err);
        //    else {
        //        console.log(buffer.length);
        //        wsServer.broadcast(JSON.stringify(buffer.toString("base64")));
        //    }
        //});
        setTimeout(mix, 500);
    }
    else
        setTimeout(mix, 500);

}

mix();