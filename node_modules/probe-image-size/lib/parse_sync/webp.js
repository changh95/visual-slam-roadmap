'use strict';

/* eslint-disable no-bitwise */
/* eslint-disable consistent-return */

var str2arr      = require('../common').str2arr;
var sliceEq      = require('../common').sliceEq;
var readUInt16LE = require('../common').readUInt16LE;
var readUInt32LE = require('../common').readUInt32LE;
var exif         = require('../exif_utils');


var SIG_RIFF = str2arr('RIFF');
var SIG_WEBP = str2arr('WEBP');


function parseVP8(data, offset) {
  if (data[offset + 3] !== 0x9D || data[offset + 4] !== 0x01 || data[offset + 5] !== 0x2A) {
    // bad code block signature
    return;
  }

  return {
    width:  readUInt16LE(data, offset + 6) & 0x3FFF,
    height: readUInt16LE(data, offset + 8) & 0x3FFF,
    type:   'webp',
    mime:   'image/webp',
    wUnits: 'px',
    hUnits: 'px'
  };
}


function parseVP8L(data, offset) {
  if (data[offset] !== 0x2F) return;

  var bits = readUInt32LE(data, offset + 1);

  return {
    width:  (bits & 0x3FFF) + 1,
    height: ((bits >> 14) & 0x3FFF) + 1,
    type:   'webp',
    mime:   'image/webp',
    wUnits: 'px',
    hUnits: 'px'
  };
}


function parseVP8X(data, offset) {
  return  {
    // TODO: replace with `data.readUIntLE(8, 3) + 1`
    //       when 0.10 support is dropped
    width:  ((data[offset + 6] << 16) | (data[offset + 5] << 8) | data[offset + 4]) + 1,
    height: ((data[offset + 9] << offset) | (data[offset + 8] << 8) | data[offset + 7]) + 1,
    type:   'webp',
    mime:   'image/webp',
    wUnits: 'px',
    hUnits: 'px'
  };
}


module.exports = function (data) {
  if (data.length < 16) return;

  // check /^RIFF....WEBPVP8([ LX])$/ signature
  if (!sliceEq(data, 0, SIG_RIFF) && !sliceEq(data, 8, SIG_WEBP)) return;

  var offset = 12;
  var result = null;
  var exif_orientation = 0;
  var fileLength = readUInt32LE(data, 4) + 8;

  if (fileLength > data.length) return;

  while (offset + 8 < fileLength) {
    if (data[offset] === 0) {
      // after each chunk of odd size there should be 0 byte of padding, skip those
      offset++;
      continue;
    }

    var header = String.fromCharCode.apply(null, data.slice(offset, offset + 4));
    var length = readUInt32LE(data, offset + 4);

    if (header === 'VP8 ' && length >= 10) {
      result = result || parseVP8(data, offset + 8);
    } else if (header === 'VP8L' && length >= 9) {
      result = result || parseVP8L(data, offset + 8);
    } else if (header === 'VP8X' && length >= 10) {
      result = result || parseVP8X(data, offset + 8);
    } else if (header === 'EXIF') {
      exif_orientation = exif.get_orientation(data.slice(offset + 8, offset + 8 + length));

      // exif is the last chunk we care about, stop after it
      offset = Infinity;
    }

    offset += 8 + length;
  }

  if (!result) return;

  if (exif_orientation > 0) {
    result.orientation = exif_orientation;
  }

  return result;
};
