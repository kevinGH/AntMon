var spawn = require('child_process').spawn,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 9999 }),
    streamURL = "rtsp://admin:123456@10.144.183.183:80/",
    ffmpeg = spawn('ffmpeg', ['-i', streamURL, '-loglevel', 'quiet', '-r', '9', '-q:v', '10', '-f', 'image2pipe', '-']),
    //ffprobe = spawn('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_streams', streamURL]),
    probe = require('node-ffprobe');
    //ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-r', '9', '-q:v', '10', '-f', 'image2pipe', '-']),
    //ffmpeg = spawn('ffmpeg', ['-i', 'rtsp://admin:123456@10.144.183.183:80/', '-loglevel', 'quiet', '-q:v', '10', '-f', 'image2pipe', '-vcodec', 'png', '-']),
    buffer = '',
    counter = 0,
    info_streams = {},
    resolution = { width: 0, height: 0 };
var PNG_HEADER_BUF = new Buffer([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    PNG_HEADER_STRING = PNG_HEADER_BUF.toString('binary'),
    JPEG_HEADER_BUF = new Buffer([0xff, 0xd8]),
    JPEG_HEADER_STRING = JPEG_HEADER_BUF.toString('binary'),
    IMAGEHEADER = JPEG_HEADER_STRING;

var meanLengthDiffSum = 0, v = 0, sum = 0, max = 0, mean = 0, min = 10000000, total = 0, lastJitter = 0, Jitter = 0, differLenth = 0, lastFileLength = 0, FileLength = 0, motionFlag = 0;
var util = require('util');

probe(streamURL, function (err, probeData) {
    resolution.width = probeData.streams[0].width;
    resolution.height = probeData.streams[0].height;

    console.log(probeData);
});

//ffprobe.stdout.on('data', function (data) {
//    //var probeData = new Buffer(data, 'binary');
//    info_streams = JSON.parse(data.toString('binary'));
//    //Resolution.width = info_streams.streams.width;
//    //Resolution.height = info_streams.streams.height;

//    console.log(info_streams);
//});
//ffprobe.on('close', function (code) {
//    console.log('ffprobe child process exited with code ' + code);
//});
//ffprobe.stderr.on('data', function (data) {
//    console.log('probe stderr: ' + data);
//});

ffmpeg.stdout.on('data', function (data) {
    //console.log(new Date());
    if (wss.clients.length > 0) { // 有人連進來才處理
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

            // motion detection
            var FileLength = fileContents.length;
            counter++;
            differLenth = FileLength - lastFileLength;
            Jitter = (lastJitter) * 99 / 100 + Math.abs(differLenth) / 100;

            if (Jitter > lastJitter)
                motionFlag++;
            else if (motionFlag > 0)
                motionFlag--;
           

            // websocket broadcast
            wss.broadcast(fileContents, now.getTime(), now.getTimezoneOffset(), motionFlag);

            buffer = IMAGEHEADER + contentList.slice(2).join(IMAGEHEADER);
            

            //console.log(util.format('count=%d, FileLength=%d, jitter=%d, %d', counter, FileLength, Jitter, motionFlag));
            lastFileLength = FileLength;
            lastJitter = Jitter;
        }
    }
});

ffmpeg.on('close', function (code) {
    console.log('ffmpeg child process exited with code ' + code);
});
ffmpeg.stderr.on('data', function (data) {
    console.log('ffmpeg stderr: ' + data);
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
wss.broadcast = function broadcast(data, timestamp, timezoneOffet, motionValue) {
    var msg = {
        UTCTime: timestamp,
        TimezoneOffset: timezoneOffet,
        //Img: data.toString('base64')
        Img: data,
        ImgLength: data.length,
        Motion: motionValue,
        Resolution: resolution,
        MimeType: "data:image/jpg;"
    };
    sendString = JSON.stringify(msg);
    
    wss.clients.forEach(function each(client) {
        client.send(sendString, function ack(error) {
            if (error)
                console.log(error);
        });
    });
};
