var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10005 });
var currentFrameUTCTime = 0;
var ImgSize = { defaultX: 1280, defaultY: 1024, outputX: 1280, outputY: 1024 };
var devicesSize = { wearables: { x: 320, y: 240 }, phones: { x: 640, y: 480 }, tablets: { x: 1280, y: 1024 }, laptops: {x: 1280, y: 1024}};
var resolutionAspectRatio;
var gm = require("gm");
var outputSize = {width: 0, height: 0};

wsSource.on('open', function open() {

});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
        msg = JSON.parse(data);
        currentFrameUTCTime = msg.UTCTime;

        //resolutionAspectRatio = msg.Resolution.width / msg.Resolution.height;
        if (outputSize.width != 0) {
            msg.Resolution = { width: outputSize.width, height: outputSize.height };
            msg.MimeType += "base64,";

            gm(new Buffer(msg.Img)).resize(outputSize.width, outputSize.height).gravity('Center').background("#000000").extent(outputSize.width, outputSize.height).toBuffer('JPG', function (err, buffer) {
                msg.Img = buffer.toString("base64");
                msg.ImgLength = msg.Img.length;
                
                wsServer.broadcast(JSON.stringify(msg));
            });
        }
        //else {
        //    msg.Img = new Buffer(msg.Img).toString('base64');
            
        //    msg.ImgLength = msg.Img.length;
        //    msg.MimeType += "base64,";

        //    wsServer.broadcast(JSON.stringify(msg));
        //}
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
    ws.on('message', function incoming(message) {
        console.log(message);

        if (message == "downsize") {
            if (ImgSize.outputX > 100) {
                ImgSize.outputX = ImgSize.outputX / 2;
                ImgSize.outputY = ImgSize.outputY / 2;
            }
        }
        else if (message == "upsize"){
            if (ImgSize.defaultX != ImgSize.outputX) {
                ImgSize.outputX = ImgSize.outputX * 2;
                ImgSize.outputY = ImgSize.outputY * 2;
            }
        }
        else if (message == "wearables") {
            ImgSize.outputX = devicesSize.wearables.x;
            ImgSize.outputY = devicesSize.wearables.y;
        }
        else if (message == "laptops") {
            ImgSize.outputX = devicesSize.laptops.x;
            ImgSize.outputY = devicesSize.laptops.y;
        }
        else if (message == "tablets") {
            ImgSize.outputX = devicesSize.tablets.x;
            ImgSize.outputY = devicesSize.tablets.y;
        }
        else if (message == "phones") {
            ImgSize.outputX = devicesSize.phones.x;
            ImgSize.outputY = devicesSize.phones.y;
        }
        else {
            var msg = JSON.parse(message);
            outputSize.width = msg.width;
            outputSize.height = msg.height;
            
        }
            
        //console.log("x:" + ImgSize.outputX + " y:" + ImgSize.outputY);
        //console.log("currentFrameUTCTime:" + currentFrameUTCTime + " feebackUTCTime:" + message.UTCTime);

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

