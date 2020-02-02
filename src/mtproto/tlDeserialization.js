import bigint from './bin_utils';
import { uintToInt, gzipUncompress, bytesToArrayBuffer } from './bin_utils';
import Config from '../config';

export default function TLDeserialization(buffer, options) {
    options = options || {};

    this.offset = 0; // in bytes
    this.override = options.override || {};

    this.buffer = buffer;
    this.intView = new Uint32Array(this.buffer);
    this.byteView = new Uint8Array(this.buffer);

    // this.debug = options.debug !== undefined ? options.debug : Config.Modes.debug
    this.mtproto = options.mtproto || false;
    return this;
}

TLDeserialization.prototype.readInt = function (field) {
    if (this.offset >= this.intView.length * 4) {
        throw new Error('Nothing to fetch: ' + field);
    }

    var i = this.intView[this.offset / 4];

    this.debug && console.log('<<<', i.toString(16), i, field);

    this.offset += 4;

    return i;
};

TLDeserialization.prototype.fetchInt = function (field) {
    return this.readInt((field || '') + ':int');
};

TLDeserialization.prototype.fetchDouble = function (field) {
    var buffer = new ArrayBuffer(8);
    var intView = new Int32Array(buffer);
    var doubleView = new Float64Array(buffer);

    intView[0] = this.readInt((field || '') + ':double[low]'),
        intView[1] = this.readInt((field || '') + ':double[high]');

    return doubleView[0];
};

TLDeserialization.prototype.fetchLong = function (field) {
    var iLow = this.readInt((field || '') + ':long[low]');
    var iHigh = this.readInt((field || '') + ':long[high]');

    var longDec = bigint(iHigh).shiftLeft(32).add(bigint(iLow)).toString();

    return longDec;
};

TLDeserialization.prototype.fetchBool = function (field) {
    var i = this.readInt((field || '') + ':bool');
    if (i == 0x997275b5) {
        return true;
    } else if (i == 0xbc799737) {
        return false;
    }

    this.offset -= 4;
    return this.fetchObject('Object', field);
};

TLDeserialization.prototype.fetchString = function (field) {
    var len = this.byteView[this.offset++];

    if (len == 254) {
        var len = this.byteView[this.offset++] |
            (this.byteView[this.offset++] << 8) |
            (this.byteView[this.offset++] << 16);
    }

    var sUTF8 = '';
    for (var i = 0; i < len; i++) {
        sUTF8 += String.fromCharCode(this.byteView[this.offset++]);
    }

    // Padding
    while (this.offset % 4) {
        this.offset++;
    }

    try {
        var s = decodeURIComponent(escape(sUTF8));
    } catch (e) {
        var s = sUTF8;
    }

    this.debug && console.log('<<<', s, (field || '') + ':string');

    return s;
};

TLDeserialization.prototype.fetchBytes = function (field) {
    var len = this.byteView[this.offset++];

    if (len == 254) {
        len = this.byteView[this.offset++] |
            (this.byteView[this.offset++] << 8) |
            (this.byteView[this.offset++] << 16);
    }

    var bytes = this.byteView.subarray(this.offset, this.offset + len);
    this.offset += len;

    // Padding
    while (this.offset % 4) {
        this.offset++;
    }

    this.debug && console.log('<<<', bytesToHex(bytes), (field || '') + ':bytes');

    return bytes;
};

TLDeserialization.prototype.fetchIntBytes = function (bits, typed, field) {
    if (bits % 32) {
        throw new Error('Invalid bits: ' + bits);
    }

    var len = bits / 8;
    if (typed) {
        var result = this.byteView.subarray(this.offset, this.offset + len);
        this.offset += len;
        return result;
    }

    var bytes = [];
    for (var i = 0; i < len; i++) {
        bytes.push(this.byteView[this.offset++]);
    }

    this.debug && console.log('<<<', bytesToHex(bytes), (field || '') + ':int' + bits);

    return bytes;
};

TLDeserialization.prototype.fetchRawBytes = function (len, typed, field) {
    if (len === false) {
        len = this.readInt((field || '') + '_length');
        if (len > this.byteView.byteLength) {
            throw new Error('Invalid raw bytes length: ' + len + ', buffer len: ' + this.byteView.byteLength);
        }
    }

    if (typed) {
        var bytes = new Uint8Array(len);
        bytes.set(this.byteView.subarray(this.offset, this.offset + len));
        this.offset += len;
        return bytes;
    }

    var bytes = [];
    for (var i = 0; i < len; i++) {
        bytes.push(this.byteView[this.offset++]);
    }

    this.debug && console.log('<<<', bytesToHex(bytes), (field || ''));

    return bytes;
};

TLDeserialization.prototype.fetchObject = function (type, field) {
    switch (type) {
        case '#':
        case 'int':
            return this.fetchInt(field);
        case 'long':
            return this.fetchLong(field);
        case 'int128':
            return this.fetchIntBytes(128, false, field);
        case 'int256':
            return this.fetchIntBytes(256, false, field);
        case 'int512':
            return this.fetchIntBytes(512, false, field);
        case 'string':
            return this.fetchString(field);
        case 'bytes':
            return this.fetchBytes(field);
        case 'double':
            return this.fetchDouble(field);
        case 'Bool':
            return this.fetchBool(field);
        case 'true':
            return true;
    }

    field = field || type || 'Object';

    if (type.substr(0, 6) == 'Vector' || type.substr(0, 6) == 'vector') {
        if (type.charAt(0) == 'V') {
            var constructor = this.readInt(field + '[id]');
            var constructorCmp = uintToInt(constructor);

            if (constructorCmp == 0x3072cfa1) { // Gzip packed
                var compressed = this.fetchBytes(field + '[packed_string]');
                var uncompressed = gzipUncompress(compressed);
                var buffer = bytesToArrayBuffer(uncompressed);
                var newDeserializer = (new TLDeserialization(buffer));

                return newDeserializer.fetchObject(type, field);
            }

            if (constructorCmp != 0x1cb5c415) {
                throw new Error('Invalid vector constructor ' + constructor);
            }
        }

        var len = this.readInt(field + '[count]');
        var result = [];
        if (len > 0) {
            var itemType = type.substr(7, type.length - 8); // for "Vector<itemType>"
            for (var i = 0; i < len; i++) {
                result.push(this.fetchObject(itemType, field + '[' + i + ']'));
            }
        }

        return result;
    }

    var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API;
    var predicate = false;
    var constructorData = false;

    if (type.charAt(0) == '%') {
        var checkType = type.substr(1);
        for (var i = 0; i < schema.constructors.length; i++) {
            if (schema.constructors[i].type == checkType) {
                constructorData = schema.constructors[i];
                break;
            }
        }
        if (!constructorData) {
            throw new Error('Constructor not found for type: ' + type);
        }
    }
    else if (type.charAt(0) >= 97 && type.charAt(0) <= 122) {
        for (var i = 0; i < schema.constructors.length; i++) {
            if (schema.constructors[i].predicate == type) {
                constructorData = schema.constructors[i];
                break;
            }
        }
        if (!constructorData) {
            throw new Error('Constructor not found for predicate: ' + type);
        }
    } else {
        var constructor = this.readInt(field + '[id]');
        var constructorCmp = uintToInt(constructor);

        if (constructorCmp == 0x3072cfa1) { // Gzip packed
            var compressed = this.fetchBytes(field + '[packed_string]');
            var uncompressed = gzipUncompress(compressed);
            var buffer = bytesToArrayBuffer(uncompressed);
            var newDeserializer = (new TLDeserialization(buffer));

            return newDeserializer.fetchObject(type, field);
        }

        var index = schema.constructorsIndex;
        if (!index) {
            schema.constructorsIndex = index = {};
            for (var i = 0; i < schema.constructors.length; i++) {
                index[schema.constructors[i].id] = i;
            }
        }
        var i = index[constructorCmp];
        if (i) {
            constructorData = schema.constructors[i];
        }

        var fallback = false;
        if (!constructorData && this.mtproto) {
            var schemaFallback = Config.Schema.API;
            for (i = 0; i < schemaFallback.constructors.length; i++) {
                if (schemaFallback.constructors[i].id == constructorCmp) {
                    constructorData = schemaFallback.constructors[i];

                    delete this.mtproto;
                    fallback = true;
                    break;
                }
            }
        }
        if (!constructorData) {
            throw new Error('Constructor not found: ' + constructor + ' ' + this.fetchInt() + ' ' + this.fetchInt());
        }
    }

    predicate = constructorData.predicate;

    var result = { '_': predicate };
    var overrideKey = (this.mtproto ? 'mt_' : '') + predicate;
    var self = this;

    if (this.override[overrideKey]) {
        this.override[overrideKey].apply(this, [result, field + '[' + predicate + ']']);
    } else {
        var i, param;
        var type, isCond;
        var condType, fieldBit;
        var value;
        var len = constructorData.params.length;
        for (i = 0; i < len; i++) {
            param = constructorData.params[i];
            type = param.type;
            if (type == '#' && result.pFlags === undefined) {
                result.pFlags = {};
            }
            if (isCond = (type.indexOf('?') !== -1)) {
                condType = type.split('?');
                fieldBit = condType[0].split('.');
                if (!(result[fieldBit[0]] & (1 << fieldBit[1]))) {
                    continue;
                }
                type = condType[1];
            }

            value = self.fetchObject(type, field + '[' + predicate + '][' + param.name + ']');

            if (isCond && type === 'true') {
                result.pFlags[param.name] = value;
            } else {
                result[param.name] = value;
            }
        }
    }

    if (fallback) {
        this.mtproto = true;
    }

    return result;
};

TLDeserialization.prototype.getOffset = function () {
    return this.offset;
};

TLDeserialization.prototype.fetchEnd = function () {
    if (this.offset != this.byteView.length) {
        throw new Error('Fetch end with non-empty buffer');
    }
    
    return true;
};
