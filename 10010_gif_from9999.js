var WebSocket = require('ws'),
    WebSocketServer = require('ws').Server;
var wsSource = new WebSocket('ws://localhost:9999');
var wsServer = new WebSocketServer({ port: 10010 });
var fs = require('fs');
var omggif = require('omggif');
var gifReader = omggif.GifReader;
var framecount = 0, maxframecount = 20, gifstart = false, gifS, gifE, tailframe = false;;
var tempBuffer = new Buffer(10240 * 10240);
var gf = new omggif.GifWriter(tempBuffer, 160, 120, { loop: 0 });
var gm = require('gm');
var outputType = 1; // 0:file 1:websocket

wsSource.on('open', function open() {

});

wsSource.on('message', function (data, flags) {
    //if (wsServer.clients.length > 0) { // 有人連進來才處理
    msg = JSON.parse(data);
    var buf = new Buffer(msg.Img);
    //console.log(msg.Motion);

    if (!gifstart && msg.Motion > 0) { // start gif       
        gifstart = true;
        framecount = 0;
        tempBuffer.fill();
        gf = new omggif.GifWriter(tempBuffer, 160, 120, { loop: 0 });
        gifS = msg.UTCTime;

    }
    else if (gifstart && msg.Motion == 0) { // end gif
        gifstart = false;
        //if (framecount > 15 || tailframe) {
        if (framecount > 15) {
            gifE = msg.UTCTime;
            var filename = gifS + "_" + gifE + ".gif";

            console.log("close file " + filename);

            if (outputType == 0)
                fs.writeFileSync(filename, tempBuffer.slice(0, gf.end()));
            else {
                var gfEndLength = gf.end();
                var sendBuffer = new Buffer(gfEndLength);
                tempBuffer.copy(sendBuffer, 0, 0, gfEndLength);
                wsServer.broadcast(JSON.stringify({ start: gifS, end: gifE, frameCount: framecount, Img: sendBuffer.toString('base64'), MimeType: "data:image/gif;base64," }));
                //wsServer.broadcast(JSON.stringify({ start: gifS, end: gifE, frameCount: framecount, Img: new Buffer(tempBuffer.slice(0, gf.end())).toString('base64'), MimeType: "data:image/gif;base64," }));
            }
        }


        //tailframe = false;
        //framecount = 0;
        //tempBuffer.fill();
        //gf = new omggif.GifWriter(tempBuffer, 160, 120, { loop: 0 });
        //gifS = msg.UTCTime;
    }
    //else if (gifstart && framecount == 50) { // frame too much. close file.
    //    // end 
    //    gifE = msg.UTCTime;
    //    var filename = gifS + "_" + gifE + ".gif";

    //    console.log("close file " + filename);

    //    if (outputType == 0)
    //        fs.writeFileSync(filename, tempBuffer.slice(0, gf.end()));
    //    else {
    //        var gfEndLength = gf.end();
    //        var sendBuffer = new Buffer(gfEndLength);
    //        tempBuffer.copy(sendBuffer, 0, 0, gfEndLength);
    //        wsServer.broadcast(JSON.stringify({ start: gifS, end: gifE, frameCount: framecount, Img: sendBuffer.toString('base64'), MimeType: "data:image/gif;base64," }));
    //    }


    //    // start
    //    //tailframe = true;
    //    framecount = 0;
    //    tempBuffer.fill();
    //    gf = new omggif.GifWriter(tempBuffer, 160, 120, { loop: 0 });
    //    gifS = msg.UTCTime;
    //}

    if (gifstart) {
        gm(buf).resize(160, 120).toBuffer('GIF', function (err, gifBuffer) {
            var reader = new gifReader(gifBuffer);
            var frame = reader.frameInfo(0);
            var num_pixels = frame.width * frame.height;
            var index_stream = new Uint8Array(num_pixels);  // At most 8-bit indices.
            var code_palette = new Uint32Array(256);

            GifReaderLZWOutputIndexStream(gifBuffer, frame.data_offset, index_stream, num_pixels);

            var b = gifBuffer.slice(frame.palette_offset, frame.data_offset - frame.palette_offset);
            for (var i = 0; i < b.length && i < 256; i++)
                code_palette[i] = parseInt(b.slice(i * 3, i * 3 + 3).toString('hex'), 16);

            gf.addFrame(0, 0, 160, 120, index_stream, { palette: code_palette });
            framecount++;
        });
    }

    //msg.Img = new Buffer(msg.Img).toString('base64');
    //wsServer.broadcast(JSON.stringify(msg));
    //console.log(msg.UTCTime);
    //}
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

function isArray(ar) {
    return ar instanceof Array
        || Array.isArray(ar)
        || (ar && ar !== Object.prototype && isArray(ar.__proto__));
}
function GifReaderLZWOutputIndexStream(code_stream, p, output, output_length) {
    var min_code_size = code_stream[p++];
    //console.log(min_code_size);
    var clear_code = 1 << min_code_size;
    var eoi_code = clear_code + 1;
    var next_code = eoi_code + 1;
    //console.log(clear_code);
    //console.log(eoi_code);
    //console.log(next_code);
    var cur_code_size = min_code_size + 1;  // Number of bits per code.
    // NOTE: This shares the same name as the encoder, but has a different
    // meaning here.  Here this masks each code coming from the code stream.
    var code_mask = (1 << cur_code_size) - 1;
    var cur_shift = 0;
    var cur = 0;

    var op = 0;  // Output pointer.

    var subblock_size = code_stream[p++];
    //console.log(subblock_size);
    // TODO(deanm): Would using a TypedArray be any faster?  At least it would
    // solve the fast mode / backing store uncertainty.
    // var code_table = Array(4096);
    var code_table = new Int32Array(4096);  // Can be signed, we only use 20 bits.

    var prev_code = null;  // Track code-1.

    while (true) {
        // Read up to two bytes, making sure we always 12-bits for max sized code.
        while (cur_shift < 16) {
            if (subblock_size === 0) break;  // No more data to be read.

            cur |= code_stream[p++] << cur_shift;
            cur_shift += 8;

            if (subblock_size === 1) {  // Never let it get to 0 to hold logic above.
                subblock_size = code_stream[p++];  // Next subblock.
            } else {
                --subblock_size;
            }

        }
        //console.log("1111");
        //console.log(cur_shift);
        //console.log(cur_code_size);

        // TODO(deanm): We should never really get here, we should have received
        // and EOI.
        if (cur_shift < cur_code_size)
            break;

        var code = cur & code_mask;
        cur >>= cur_code_size;
        cur_shift -= cur_code_size;

        // TODO(deanm): Maybe should check that the first code was a clear code,
        // at least this is what you're supposed to do.  But actually our encoder
        // now doesn't emit a clear code first anyway.
        if (code === clear_code) {
            // We don't actually have to clear the table.  This could be a good idea
            // for greater error checking, but we don't really do any anyway.  We
            // will just track it with next_code and overwrite old entries.

            next_code = eoi_code + 1;
            cur_code_size = min_code_size + 1;
            code_mask = (1 << cur_code_size) - 1;

            // Don't update prev_code ?
            prev_code = null;
            continue;
        } else if (code === eoi_code) {
            break;
        }

        // We have a similar situation as the decoder, where we want to store
        // variable length entries (code table entries), but we want to do in a
        // faster manner than an array of arrays.  The code below stores sort of a
        // linked list within the code table, and then "chases" through it to
        // construct the dictionary entries.  When a new entry is created, just the
        // last byte is stored, and the rest (prefix) of the entry is only
        // referenced by its table entry.  Then the code chases through the
        // prefixes until it reaches a single byte code.  We have to chase twice,
        // first to compute the length, and then to actually copy the data to the
        // output (backwards, since we know the length).  The alternative would be
        // storing something in an intermediate stack, but that doesn't make any
        // more sense.  I implemented an approach where it also stored the length
        // in the code table, although it's a bit tricky because you run out of
        // bits (12 + 12 + 8), but I didn't measure much improvements (the table
        // entries are generally not the long).  Even when I created benchmarks for
        // very long table entries the complexity did not seem worth it.
        // The code table stores the prefix entry in 12 bits and then the suffix
        // byte in 8 bits, so each entry is 20 bits.

        var chase_code = code < next_code ? code : prev_code;

        // Chase what we will output, either {CODE} or {CODE-1}.
        var chase_length = 0;
        var chase = chase_code;
        while (chase > clear_code) {
            chase = code_table[chase] >> 8;
            ++chase_length;
        }

        var k = chase;

        var op_end = op + chase_length + (chase_code !== code ? 1 : 0);
        if (op_end > output_length) {
            console.log("Warning, gif stream longer than expected.");
            return;
        }

        // Already have the first byte from the chase, might as well write it fast.
        output[op++] = k;

        op += chase_length;
        var b = op;  // Track pointer, writing backwards.

        if (chase_code !== code)  // The case of emitting {CODE-1} + k.
            output[op++] = k;

        chase = chase_code;
        while (chase_length--) {
            chase = code_table[chase];
            output[--b] = chase & 0xff;  // Write backwards.
            chase >>= 8;  // Pull down to the prefix code.
        }

        if (prev_code !== null && next_code < 4096) {
            code_table[next_code++] = prev_code << 8 | k;
            // TODO(deanm): Figure out this clearing vs code growth logic better.  I
            // have an feeling that it should just happen somewhere else, for now it
            // is awkward between when we grow past the max and then hit a clear code.
            // For now just check if we hit the max 12-bits (then a clear code should
            // follow, also of course encoded in 12-bits).
            if (next_code >= code_mask + 1 && cur_code_size < 12) {
                ++cur_code_size;
                code_mask = code_mask << 1 | 1;
            }
        }

        prev_code = code;
    }

    if (op !== output_length) {
        console.log("Warning, gif stream shorter than expected.");
    }

    return output;
}