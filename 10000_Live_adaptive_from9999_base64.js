var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10000 });
var currentFrameUTCTime = 0;
var ImgSize = { defaultX: 1280, defaultY: 1024, outputX: 1280, outputY: 1024 };
var thshold = 10, adapter = 0;
var gm = require("gm");


wsSource.on('open', function open() {

});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
        msg = JSON.parse(data);
        currentFrameUTCTime = msg.UTCTime;


        if (ImgSize.defaultX != ImgSize.outputX) {
            gm(new Buffer(msg.Img)).resize(ImgSize.outputX, ImgSize.ouputY).toBuffer('JPG', function (err, buffer) {
                msg.Img = buffer.toString("base64");
            });
        }
        else
            msg.Img = new Buffer(msg.Img).toString('base64');

        wsServer.broadcast(JSON.stringify(msg));
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
    ws.on('message', function incoming(feedbackUTCTime) {

        var diffTimestampe = currentFrameUTCTime - feedbackUTCTime;
        console.log("diff:" + diffTimestampe);
        if (diffTimestampe > 100) {
            adapter += 1;
            if (adapter > thshold) {
                adapter = 0;
                console.log("downsize");
                ImgSize.outputX = ImgSize.outputX / 2;
                ImgSize.outputY = ImgSize.outputY / 2;
                console.log("x:" + ImgSize.outputX + " y:" + ImgSize.outputY);
            }
        }
        else {
            adapter = (adapter == 0) ? 0 : adapter - 1;
            if (adapter < thshold && ImgSize.defaultX != ImgSize.outputX) {
                console.log("upsize");
                ImgSize.outputX = ImgSize.outputX * 2;
                ImgSize.outputY = ImgSize.outputY * 2;
                console.log("x:" + ImgSize.outputX + " y:" + ImgSize.outputY);
            }
        }


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

