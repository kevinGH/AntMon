var WebSocketServer = require('ws').Server;
var wsServer = new WebSocketServer({ port: 10001 });
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var url = 'mongodb://localhost:27017/local';
var db;
var jpeg_collection;

wsServer.on('connection', function connection(ws) {
    console.log('user connection. totoal users count=' + wsServer.clients.length);

    ws.on('message', function incoming(msg) {
        var jsonMsg = JSON.parse(msg);
        var queryStart = jsonMsg.start,
            queryEnd = jsonMsg.end,
            queryTimestamp = jsonMsg.wsRequestEventTimestamp,
            queryScale = jsonMsg.scale,
            responseData = [];

        

    });
    ws.on('close', function () {
        console.log('user disconnection. total users count=' + wsServer.clients.length);
    });
    ws.on('error', function (edata) {
        console.log('stderr: ' + edata);
    });
});
wsServer.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data, function ack(error) {
            if (error)
                console.log(error);
        });
    });
};

// connect db
MongoClient.connect(url, function (err, database) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    db = database;
    // Get the documents collection 
    jpeg_collection = db.collection('jpeg');
});