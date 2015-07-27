var spawn = require('child_process').spawn,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 9999 }),
    ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-loglevel', 'quiet', '-q:v', '10', '-f', 'image2pipe', '-']),
    //ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-loglevel', 'quiet', '-q:v', '10', '-f', 'image2pipe', '-vcodec', 'png', '-']),
    buffer = '',
    counter = 0;
var PNG_HEADER_BUF = new Buffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    PNG_HEADER_STRING = PNG_HEADER_BUF.toString('binary'),
    JPEG_HEADER_BUF = new Buffer([0xff, 0xd8]),
    JPEG_HEADER_STRING = JPEG_HEADER_BUF.toString('binary'),
    IMAGEHEADER = JPEG_HEADER_STRING;




ffmpeg.stdout.on('data', function (data) {
    //console.log(new Date());
    if (wss.clients.length > 0) {
        buffer += data.toString('binary');

        // trim to header
        var headerPosition = buffer.indexOf(IMAGEHEADER);
        if (headerPosition > 0)
            buffer = buffer.substr(headerPosition);

        // search for image
        var contentList = buffer.split(IMAGEHEADER);
        if (contentList.length > 2) {
            var fileContents = new Buffer(IMAGEHEADER + contentList[1], 'binary');
            var now = new Date();
            // websocket broadcast
            wss.broadcast(fileContents, now.getTime(), now.getTimezoneOffset());

            buffer = IMAGEHEADER + contentList.slice(2).join(IMAGEHEADER);

            console.log(counter);
            counter++;
        }
    }
});

ffmpeg.on('close', function (code) {
    console.log('ffmpeg child process exited with code ' + code);
});
ffmpeg.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
});


wss.on('connection', function connection(ws) {
    console.log('user connection. totoal users count=' + wss.clients.length);
    ws.on('close', function () {
        console.log('user disconnection. total users count=' + wss.clients.length);
    });
    ws.on('error', function (edata) {
        console.log('stderr: ' + edata);
    });
});
wss.broadcast = function broadcast(data, timestamp, timezoneOffet) {
    
    var msg = {
        UTCTime: timestamp,
        TimezoneOffset: timezoneOffet,
        Img: data.toString('base64')
    };
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(msg), function ack(error) {
            if (error)
                console.log(error);
        });
    });
};
