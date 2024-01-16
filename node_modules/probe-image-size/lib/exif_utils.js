
/* eslint-disable no-bitwise */
/* eslint-disable consistent-return */

'use strict';

//////////////////////////////////////////////////////////////////////////
// Helpers
//
function error(message, code) {
  var err = new Error(message);
  err.code = code;
  return err;
}


function utf8_decode(str) {
  try {
    return decodeURIComponent(escape(str));
  } catch (_) {
    return str;
  }
}


//////////////////////////////////////////////////////////////////////////
// Exif parser
//
// Input:
//  - jpeg_bin:   Uint8Array - jpeg file
//  - exif_start: Number     - start of TIFF header (after Exif\0\0)
//  - exif_end:   Number     - end of Exif segment
//  - on_entry:   Number     - callback
//
function ExifParser(jpeg_bin, exif_start, exif_end) {
  // Uint8Array, exif without signature (which isn't included in offsets)
  this.input      = jpeg_bin.subarray(exif_start, exif_end);

  // offset correction for `on_entry` callback
  this.start      = exif_start;

  // Check TIFF header (includes byte alignment and first IFD offset)
  var sig = String.fromCharCode.apply(null, this.input.subarray(0, 4));

  if (sig !== 'II\x2A\0' && sig !== 'MM\0\x2A') {
    throw error('invalid TIFF signature', 'EBADDATA');
  }

  // true if motorola (big endian) byte alignment, false if intel
  this.big_endian = sig[0] === 'M';
}


ExifParser.prototype.each = function (on_entry) {
  // allow premature exit
  this.aborted = false;

  var offset = this.read_uint32(4);

  this.ifds_to_read = [ {
    id:     0,
    offset: offset
  } ];

  while (this.ifds_to_read.length > 0 && !this.aborted) {
    var i = this.ifds_to_read.shift();
    if (!i.offset) continue;
    this.scan_ifd(i.id, i.offset, on_entry);
  }
};


ExifParser.prototype.read_uint16 = function (offset) {
  var d = this.input;
  if (offset + 2 > d.length) throw error('unexpected EOF', 'EBADDATA');

  return this.big_endian ?
    d[offset] * 0x100 + d[offset + 1] :
    d[offset] + d[offset + 1] * 0x100;
};


ExifParser.prototype.read_uint32 = function (offset) {
  var d = this.input;
  if (offset + 4 > d.length) throw error('unexpected EOF', 'EBADDATA');

  return this.big_endian ?
    d[offset] * 0x1000000 + d[offset + 1] * 0x10000 + d[offset + 2] * 0x100 + d[offset + 3] :
    d[offset] + d[offset + 1] * 0x100 + d[offset + 2] * 0x10000 + d[offset + 3] * 0x1000000;
};


ExifParser.prototype.is_subifd_link = function (ifd, tag) {
  return (ifd === 0 && tag === 0x8769) || // SubIFD
         (ifd === 0 && tag === 0x8825) || // GPS Info
         (ifd === 0x8769 && tag === 0xA005); // Interop IFD
};


// Returns byte length of a single component of a given format
//
ExifParser.prototype.exif_format_length = function (format) {
  switch (format) {
    case 1: // byte
    case 2: // ascii
    case 6: // sbyte
    case 7: // undefined
      return 1;

    case 3: // short
    case 8: // sshort
      return 2;

    case 4:  // long
    case 9:  // slong
    case 11: // float
      return 4;

    case 5:  // rational
    case 10: // srational
    case 12: // double
      return 8;

    default:
      // unknown type
      return 0;
  }
};


// Reads Exif data
//
ExifParser.prototype.exif_format_read = function (format, offset) {
  var v;

  switch (format) {
    case 1: // byte
    case 2: // ascii
      v = this.input[offset];
      return v;

    case 6: // sbyte
      v = this.input[offset];
      return v | (v & 0x80) * 0x1fffffe;

    case 3: // short
      v = this.read_uint16(offset);
      return v;

    case 8: // sshort
      v = this.read_uint16(offset);
      return v | (v & 0x8000) * 0x1fffe;

    case 4: // long
      v = this.read_uint32(offset);
      return v;

    case 9: // slong
      v = this.read_uint32(offset);
      return v | 0;

    case 5:  // rational
    case 10: // srational
    case 11: // float
    case 12: // double
      return null; // not implemented

    case 7: // undefined
      return null; // blob

    default:
      // unknown type
      return null;
  }
};


ExifParser.prototype.scan_ifd = function (ifd_no, offset, on_entry) {
  var entry_count = this.read_uint16(offset);

  offset += 2;

  for (var i = 0; i < entry_count; i++) {
    var tag    = this.read_uint16(offset);
    var format = this.read_uint16(offset + 2);
    var count  = this.read_uint32(offset + 4);

    var comp_length    = this.exif_format_length(format);
    var data_length    = count * comp_length;
    var data_offset    = data_length <= 4 ? offset + 8 : this.read_uint32(offset + 8);
    var is_subifd_link = false;

    if (data_offset + data_length > this.input.length) {
      throw error('unexpected EOF', 'EBADDATA');
    }

    var value = [];
    var comp_offset = data_offset;

    for (var j = 0; j < count; j++, comp_offset += comp_length) {
      var item = this.exif_format_read(format, comp_offset);
      if (item === null) {
        value = null;
        break;
      }
      value.push(item);
    }

    if (Array.isArray(value) && format === 2) {
      value = utf8_decode(String.fromCharCode.apply(null, value));
      if (value && value[value.length - 1] === '\0') value = value.slice(0, -1);
    }

    if (this.is_subifd_link(ifd_no, tag)) {
      if (Array.isArray(value) && Number.isInteger(value[0]) && value[0] > 0) {
        this.ifds_to_read.push({
          id:     tag,
          offset: value[0]
        });
        is_subifd_link = true;
      }
    }

    var entry = {
      is_big_endian:  this.big_endian,
      ifd:            ifd_no,
      tag:            tag,
      format:         format,
      count:          count,
      entry_offset:   offset + this.start,
      data_length:    data_length,
      data_offset:    data_offset + this.start,
      value:          value,
      is_subifd_link: is_subifd_link
    };

    if (on_entry(entry) === false) {
      this.aborted = true;
      return;
    }

    offset += 12;
  }

  if (ifd_no === 0) {
    this.ifds_to_read.push({
      id:     1,
      offset: this.read_uint32(offset)
    });
  }
};


module.exports.ExifParser = ExifParser;

// returns orientation stored in Exif (1-8), 0 if none was found, -1 if error
module.exports.get_orientation = function (data) {
  var orientation = 0;
  try {
    new ExifParser(data, 0, data.length).each(function (entry) {
      if (entry.ifd === 0 && entry.tag === 0x112 && Array.isArray(entry.value)) {
        orientation = entry.value[0];
        return false;
      }
    });
    return orientation;
  } catch (err) {
    return -1;
  }
};
