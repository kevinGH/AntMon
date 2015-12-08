var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9998');
var wsServer = new WebSocketServer({ port: 10008 });

wsSource.on('open', function open() {
    
});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
       
            msg = JSON.parse(data);
            msg.Img = new Buffer(msg.Img).toString('base64');
            wsServer.broadcast(JSON.stringify(msg));
        
        
        //console.log(msg.UTCTime);
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
        console.log(client.bufferedAmount);
        //if (wsServer.bufferedAmount > 1) {
        //    //tcp.pause();
        //    //flush the buffer in successive sends until ws.bufferedAmount === 0 
        //    //tcp.resume();
        //} else {
        client.send(data, function ack(error) {
            if (error)
                console.log(error);
        });
    });
};
