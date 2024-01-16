// Utils used to parse miaf-based files (avif/heic/heif)
//
//  - image collections are not supported (only last size is reported)
//  - images with metadata encoded after image data are not supported
//  - images without any `ispe` box are not supported
//

'use strict';

/* eslint-disable consistent-return */


var ParserStream = require('../common').ParserStream;
var str2arr      = require('../common').str2arr;
var sliceEq      = require('../common').sliceEq;
var readUInt32BE = require('../common').readUInt32BE;
var miaf         = require('../miaf_utils');
var exif         = require('../exif_utils');

var SIG_FTYP = str2arr('ftyp');


function safeSkip(parser, count, callback) {
  if (count === 0) { // parser._skipBytes throws error if count === 0
    callback();
    return;
  }

  parser._skipBytes(count, callback);
}


function readExifOrientation(parser, sandbox, callback) {
  if (!sandbox.exif_location || sandbox.exif_location.offset <= sandbox.offset) {
    callback(0);
    return;
  }

  parser._skipBytes(sandbox.exif_location.offset - sandbox.offset, function () {
    sandbox.offset = sandbox.exif_location.offset;

    parser._bytes(4, function (data) {
      sandbox.offset += 4;
      var sig_offset = readUInt32BE(data, 0);

      safeSkip(parser, sig_offset, function () {
        sandbox.offset += sig_offset;
        var byteCount = sandbox.exif_location.length - sig_offset - 4;

        if (byteCount <= 0) {
          callback(0);
          return;
        }

        parser._bytes(byteCount, function (exif_data) {
          sandbox.offset += byteCount;
          callback(exif.get_orientation(exif_data));
        });
      });
    });
  });
}


// sandbox is a storage for intermediate data retrieved from jpeg while parsing it
function readAvifSize(parser, sandbox) {
  parser._bytes(8, function (data) {
    sandbox.offset += 8;
    var size = readUInt32BE(data, 0) - 8;
    var type = String.fromCharCode.apply(null, data.slice(4, 8));

    if (type === 'mdat') {
      parser._skipBytes(Infinity);
      parser.push(null);
      return;
    } else if (size < 0) {
      parser._skipBytes(Infinity);
      parser.push(null);
      return;
    } else if (type === 'meta' && size > 0) {
      parser._bytes(size, function (data) {
        sandbox.offset += size;
        var imgSize = miaf.readSizeFromMeta(data);

        if (!imgSize) {
          parser._skipBytes(Infinity);
          parser.push(null);
          return;
        }

        var result = {
          width:    imgSize.width,
          height:   imgSize.height,
          type:     sandbox.fileType.type,
          mime:     sandbox.fileType.mime,
          wUnits:   'px',
          hUnits:   'px'
        };

        if (imgSize.variants.length > 1) {
          result.variants = imgSize.variants;
        }

        if (imgSize.orientation) {
          result.orientation = imgSize.orientation;
        }

        sandbox.exif_location = imgSize.exif_location;

        readExifOrientation(parser, sandbox, function (orientation) {
          if (orientation > 0) result.orientation = orientation;

          parser._skipBytes(Infinity);
          parser.push(result);
          parser.push(null);
        });
      });
    } else {
      safeSkip(parser, size, function () {
        sandbox.offset += size;
        readAvifSize(parser, sandbox);
      });
    }
  });
}


module.exports = function () {
  var parser = new ParserStream();
  var sandbox = { offset: 0, fileType: null };

  parser._bytes(8, function (data) {
    sandbox.offset += 8;
    if (!sliceEq(data, 4, SIG_FTYP)) {
      parser._skipBytes(Infinity);
      parser.push(null);
      return;
    }

    var size = readUInt32BE(data, 0) - 8;

    if (size <= 0) {
      parser._skipBytes(Infinity);
      parser.push(null);
      return;
    }

    parser._bytes(size, function (data) {
      sandbox.offset += size;
      sandbox.fileType = miaf.getMimeType(data);

      if (!sandbox.fileType) {
        parser._skipBytes(Infinity);
        parser.push(null);
        return;
      }

      readAvifSize(parser, sandbox);
    });
  });

  return parser;
};
