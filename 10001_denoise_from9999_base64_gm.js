var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10001 });
var gm = require('gm');

wsSource.on('open', function open() {
    
});

wsSource.on('message', function (data, flags) {
    if (wsServer.clients.length > 0) { // 有人連進來才處理
        msg = JSON.parse(data);
        var buf = new Buffer(msg.Img);
        //gm(buf).noise("laplacian").toBuffer('JPG', function (err, buffer) {
        //gm(buf).noise(0.9).toBuffer('JPG', function (err, buffer) {
        gm(buf).enhance().toBuffer('JPG', function (err, buffer) {
        //gm(buf).normalize().toBuffer('JPG', function (err, buffer) {
        //gm(buf).edge(3).toBuffer('JPG', function (err, buffer) {
        //gm(buf).equalize().toBuffer('JPG', function (err, buffer) {
        //gm(buf).flatten().toBuffer('JPG', function (err, buffer) {
        //gm(buf).gamma().toBuffer('JPG', function (err, buffer) {
        //gm(buf).gravity("East").toBuffer('JPG', function (err, buffer) {
        //gm(buf).lower(50, 40).toBuffer('JPG', function (err, buffer) {
        //gm(buf).magnify(9).toBuffer('JPG', function (err, buffer) {
        
        //gm(buf).minify(5).toBuffer('JPG', function (err, buffer) {
        //gm(buf).monochrome().toBuffer('JPG', function (err, buffer) {
        //gm(buf).pointSize(5).toBuffer('JPG', function (err, buffer) {
        //gm(buf).resample(640,480).toBuffer('JPG', function (err, buffer) {
        //gm(buf).scene(50).toBuffer('JPG', function (err, buffer) {
        //gm(buf).screen().toBuffer('JPG', function (err, buffer) {
        //gm(buf).spread(1).toBuffer('JPG', function (err, buffer) {
        //gm(buf).stereo().toBuffer('JPG', function (err, buffer) {
        //gm(buf).trim().toBuffer('JPG', function (err, buffer) {
        //gm(buf).antialias(true).toBuffer('JPG', function (err, buffer) {
        //gm(buf).average().toBuffer('JPG', function (err, buffer) {
        //gm(buf).despeckle().toBuffer('JPG', function (err, buffer) {
            console.log("buf="+buf.length+",buffer="+buffer.length);
            msg.Img = buffer.toString('base64');
            wsServer.broadcast(JSON.stringify(msg));
        });
        
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
