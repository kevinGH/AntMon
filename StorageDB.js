var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:9999');
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
// Connection URL 
var url = 'mongodb://localhost:27017/local';
var db;
var jpeg_collection;

// connect db
MongoClient.connect(url, function (err, database) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    db = database;
    // Get the documents collection 
    jpeg_collection = db.collection('jpeg');
});

ws.on('open', function open() {    
});

ws.on('message', function (data, flags) {
    // flags.binary will be set if a binary data is received.
    // flags.masked will be set if the data was masked.
    msg = JSON.parse(data);

    insertDocuments(msg, function (result) {
        //db.close();
        console.log(msg.UTCTime);        
    });
});

ws.on('close', function close() {
    db.close();
    console.log('disconnected');
});

var insertDocuments = function (data, callback) {
    // Insert some documents 
    jpeg_collection.insert(data, function (err, result) {
        assert.equal(err, null);
        //assert.equal(3, result.result.n);
        //assert.equal(3, result.ops.length);
        //console.log("Inserted 3 documents into the document collection");
        callback(result);
    });
}
