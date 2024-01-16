'use strict';

/* eslint-disable no-bitwise */
/* eslint-disable no-use-before-define */

var ParserStream = require('../common').ParserStream;
var str2arr      = require('../common').str2arr;
var sliceEq      = require('../common').sliceEq;
var exif         = require('../exif_utils');


var SIG_RIFF = str2arr('RIFF');
var SIG_WEBP = str2arr('WEBP');


function safeSkip(parser, count, callback) {
  if (count === 0) { // parser._skipBytes throws error if count === 0
    callback();
    return;
  }

  parser._skipBytes(count, callback);
}


function parseVP8(parser, length, sandbox) {
  parser._bytes(10, function (data) {
    // check code block signature
    if (data[3] === 0x9D && data[4] === 0x01 && data[5] === 0x2A) {
      sandbox.result = sandbox.result || {
        width:  data.readUInt16LE(6) & 0x3FFF,
        height: data.readUInt16LE(8) & 0x3FFF,
        type:   'webp',
        mime:   'image/webp',
        wUnits: 'px',
        hUnits: 'px'
      };
    }

    safeSkip(parser, length - 10, function () {
      sandbox.offset += length;
      getWebpSize(parser, sandbox);
    });
  });
}


function parseVP8L(parser, length, sandbox) {
  parser._bytes(5, function (data) {
    // check code block signature
    if (data[0] === 0x2F) {
      var bits = data.readUInt32LE(1);

      sandbox.result = sandbox.result || {
        width:  (bits & 0x3FFF) + 1,
        height: ((bits >> 14) & 0x3FFF) + 1,
        type:   'webp',
        mime:   'image/webp',
        wUnits: 'px',
        hUnits: 'px'
      };
    }

    safeSkip(parser, length - 5, function () {
      sandbox.offset += length;
      getWebpSize(parser, sandbox);
    });
  });
}


function parseVP8X(parser, length, sandbox) {
  parser._bytes(10, function (data) {
    sandbox.result = sandbox.result || {
      // TODO: replace with `data.readUIntLE(8, 3) + 1`
      //       when 0.10 support is dropped
      width:  ((data[6] << 16) | (data[5] << 8) | data[4]) + 1,
      height: ((data[9] << 16) | (data[8] << 8) | data[7]) + 1,
      type:   'webp',
      mime:   'image/webp',
      wUnits: 'px',
      hUnits: 'px'
    };

    safeSkip(parser, length - 10, function () {
      sandbox.offset += length;
      getWebpSize(parser, sandbox);
    });
  });
}


function parseExif(parser, length, sandbox) {
  parser._bytes(length, function (data) {
    // exif is the last chunk we care about, stop after it
    sandbox.offset = Infinity;
    sandbox.exif_orientation = exif.get_orientation(data);

    getWebpSize(parser, sandbox);
  });
}


function getWebpSize(parser, sandbox) {
  if (sandbox.fileLength - 8 <= sandbox.offset) {
    parser._skipBytes(Infinity);

    if (sandbox.result) {
      var result = sandbox.result;

      if (sandbox.exif_orientation > 0) {
        result.orientation = sandbox.exif_orientation;
      }

      parser.push(result);
    }

    parser.push(null);
    return;
  }

  parser._bytes(4 - sandbox.bufferedChunkHeader.length, function (data) {
    sandbox.offset += 4 - sandbox.bufferedChunkHeader.length;
    var header = sandbox.bufferedChunkHeader + String.fromCharCode.apply(null, data);

    // after each chunk of odd size there should be 0 byte of padding, skip those
    header = header.replace(/^\0+/, '');

    if (header.length < 4) {
      sandbox.bufferedChunkHeader = header;
      getWebpSize(parser, sandbox);
      return;
    }

    sandbox.bufferedChunkHeader = '';

    parser._bytes(4, function (data) {
      sandbox.offset += 4;
      var length = data.readUInt32LE(0);

      if (header === 'VP8 ' && length >= 10) {
        parseVP8(parser, length, sandbox);
      } else if (header === 'VP8L' && length >= 5) {
        parseVP8L(parser, length, sandbox);
      } else if (header === 'VP8X' && length >= 10) {
        parseVP8X(parser, length, sandbox);
      } else if (header === 'EXIF' && length >= 4) {
        parseExif(parser, length, sandbox);
      } else {
        safeSkip(parser, length, function () {
          sandbox.offset += length;
          getWebpSize(parser, sandbox);
        });
      }
    });
  });
}


module.exports = function () {
  var parser = new ParserStream();

  parser._bytes(12, function (data) {

    // check /^RIFF....WEBPVP8([ LX])$/ signature
    if (sliceEq(data, 0, SIG_RIFF) && sliceEq(data, 8, SIG_WEBP)) {
      getWebpSize(parser, {
        fileLength: data.readUInt32LE(4) + 8,
        offset: 12,
        exif_orientation: 0,
        bufferedChunkHeader: '' // for dealing with padding
      });
    } else {
      parser._skipBytes(Infinity);
      parser.push(null);
    }
  });

  return parser;
};
