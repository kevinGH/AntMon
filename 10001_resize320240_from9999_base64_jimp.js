var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10001 });
var Jimp = require("jimp");

wsSource.on('open', function open() {
    
});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
        msg = JSON.parse(data);
        var buf = new Buffer(msg.Img);
        var image = new Jimp(buf, function (err, image) {
            this.resize(320, 240, function (err, resizedImg) {
                resizedImg.getBuffer(Jimp.MIME_JPEG, function (err, buffer) {
                    msg.Img = buffer.toString('base64');
                    wsServer.broadcast(JSON.stringify(msg));
                });
                
                //resizedImg.toBuffer("jpg", function (err, buffer) {
                //    msg.Img = buffer.toString('base64');
                //    console.log(msg.Motion);
                //    //wsServer.broadcast(JSON.stringify(msg));
                //});
            });
        });
        
        //lwip.open(buf, function (err, image) {
            //console.log(err);
            //image.resize(320, 240, "lanczos", function (err, resizeImage) {
                //resizeImage.toBuffer("jpg", function (err, buffer) {
                //    msg.Img = buffer.toString('base64');
                //    console.log(msg.Motion);
                //    //wsServer.broadcast(JSON.stringify(msg));
                //});
                
            //});
        //});

        
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
