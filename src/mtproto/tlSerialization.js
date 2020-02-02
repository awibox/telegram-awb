import bigint from './bin_utils';
import { bigStringInt, intToUint } from './bin_utils';
import Config from '../config';
import Utils from '../utils';

export default function TLSerialization(options) {
    options = options || {};
    this.maxLength = options.startMaxLength || 2048; // 2Kb
    this.offset = 0; // in bytes

    this.createBuffer();

    // this.debug = options.debug !== undefined ? options.debug : Config.Modes.debug
    this.mtproto = options.mtproto || false;
    return this;
}

TLSerialization.prototype.createBuffer = function () {
    this.buffer = new ArrayBuffer(this.maxLength);
    this.intView = new Int32Array(this.buffer);
    this.byteView = new Uint8Array(this.buffer);
};

TLSerialization.prototype.getArray = function () {
    var resultBuffer = new ArrayBuffer(this.offset);
    var resultArray = new Int32Array(resultBuffer);

    resultArray.set(this.intView.subarray(0, this.offset / 4));

    return resultArray;
};

TLSerialization.prototype.getBuffer = function () {
    return this.getArray().buffer;
};

TLSerialization.prototype.getBytes = function (typed) {
    if (typed) {
        var resultBuffer = new ArrayBuffer(this.offset);
        var resultArray = new Uint8Array(resultBuffer);

        resultArray.set(this.byteView.subarray(0, this.offset));

        return resultArray;
    }

    var bytes = [];
    for (var i = 0; i < this.offset; i++) {
        bytes.push(this.byteView[i]);
    }

    return bytes;
};

TLSerialization.prototype.checkLength = function (needBytes) {
    if (this.offset + needBytes < this.maxLength) {
        return;
    }

    console.trace('Increase buffer', this.offset, needBytes, this.maxLength);
    this.maxLength = Math.ceil(Math.max(this.maxLength * 2, this.offset + needBytes + 16) / 4) * 4;
    var previousBuffer = this.buffer;
    var previousArray = new Int32Array(previousBuffer);

    this.createBuffer();

    new Int32Array(this.buffer).set(previousArray);
};

TLSerialization.prototype.writeInt = function (i, field) {

    // this.debug && console.log('>>>', i.toString(16), i, field);

    this.checkLength(4);
    this.intView[this.offset / 4] = i;
    this.offset += 4;
};

TLSerialization.prototype.storeInt = function (i, field) {
    this.writeInt(i, (field || '') + ':int');
};

TLSerialization.prototype.storeBool = function (i, field) {
    if (i) {
        this.writeInt(0x997275b5, (field || '') + ':bool');
    } else {
        this.writeInt(0xbc799737, (field || '') + ':bool');
    }
};

TLSerialization.prototype.storeLongP = function (iHigh, iLow, field) {
    this.writeInt(iLow, (field || '') + ':long[low]');
    this.writeInt(iHigh, (field || '') + ':long[high]');
};

TLSerialization.prototype.storeLong = function (sLong, field) {
    if (Array.isArray(sLong)) {
        if (sLong.length == 2) {
            return this.storeLongP(sLong[0], sLong[1], field);
        } else {
            return this.storeIntBytes(sLong, 64, field);
        }
    }

    if (typeof sLong != 'string') {
        sLong = sLong ? sLong.toString() : '0';
    }
    var divRem = bigStringInt(sLong).divideAndRemainder(bigint(0x100000000));

    this.writeInt(intToUint(divRem[1].intValue()), (field || '') + ':long[low]');
    this.writeInt(intToUint(divRem[0].intValue()), (field || '') + ':long[high]');
};

TLSerialization.prototype.storeDouble = function (f, field) {
    var buffer = new ArrayBuffer(8);
    var intView = new Int32Array(buffer);
    var doubleView = new Float64Array(buffer);

    doubleView[0] = f;

    this.writeInt(intView[0], (field || '') + ':double[low]');
    this.writeInt(intView[1], (field || '') + ':double[high]');
};

TLSerialization.prototype.storeString = function (s, field) {
    // this.debug && console.log('>>>', s, (field || '') + ':string');

    if (s === undefined) {
        s = '';
    }
    var sUTF8 = unescape(encodeURIComponent(s));

    this.checkLength(sUTF8.length + 8);

    var len = sUTF8.length;

    if (len <= 253) {
        this.byteView[this.offset++] = len;
    } else {
        this.byteView[this.offset++] = 254;
        this.byteView[this.offset++] = len & 0xFF;
        this.byteView[this.offset++] = (len & 0xFF00) >> 8;
        this.byteView[this.offset++] = (len & 0xFF0000) >> 16;
    }

    for (var i = 0; i < len; i++) {
        this.byteView[this.offset++] = sUTF8.charCodeAt(i);
    }

    // Padding
    while (this.offset % 4) {
        this.byteView[this.offset++] = 0;
    }
};

TLSerialization.prototype.storeBytes = function (bytes, field) {
    if (bytes instanceof ArrayBuffer) {
        bytes = new Uint8Array(bytes);
    }
    else if (bytes === undefined) {
        bytes = [];
    }

    // this.debug && console.log('>>>', bytesToHex(bytes), (field || '') + ':bytes');

    var len = bytes.byteLength || bytes.length;
    
    this.checkLength(len + 8);
    if (len <= 253) {
        this.byteView[this.offset++] = len;
    } else {
        this.byteView[this.offset++] = 254;
        this.byteView[this.offset++] = len & 0xFF;
        this.byteView[this.offset++] = (len & 0xFF00) >> 8;
        this.byteView[this.offset++] = (len & 0xFF0000) >> 16;
    }

    this.byteView.set(bytes, this.offset);
    this.offset += len;

    // Padding
    while (this.offset % 4) {
        this.byteView[this.offset++] = 0;
    }
};

TLSerialization.prototype.storeIntBytes = function (bytes, bits, field) {
    if (bytes instanceof ArrayBuffer) {
        bytes = new Uint8Array(bytes);
    }

    var len = bytes.length;

    if ((bits % 32) || (len * 8) != bits) {
        throw new Error('Invalid bits: ' + bits + ', ' + bytes.length);
    }

    // this.debug && console.log('>>>', bytesToHex(bytes), (field || '') + ':int' + bits);
    this.checkLength(len);

    this.byteView.set(bytes, this.offset);
    this.offset += len;
};

TLSerialization.prototype.storeRawBytes = function (bytes, field) {
    if (bytes instanceof ArrayBuffer) {
        bytes = new Uint8Array(bytes);
    }
    var len = bytes.length;

    // this.debug && console.log('>>>', bytesToHex(bytes), (field || ''));
    this.checkLength(len);

    this.byteView.set(bytes, this.offset);
    this.offset += len;
};

TLSerialization.prototype.storeMethod = function (methodName, params) {
    var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API;
    var methodData = false,
        i;

    for (i = 0; i < schema.methods.length; i++) {
        if (schema.methods[i].method == methodName) {
            methodData = schema.methods[i];
            break;
        }
    }

    if (!methodData) {
        throw new Error('No method ' + methodName + ' found');
    }

    this.storeInt(intToUint(methodData.id), methodName + '[id]');

    var param, type;
    var i, condType;
    var fieldBit;
    var len = methodData.params.length;

    for (i = 0; i < len; i++) {
        param = methodData.params[i];
        type = param.type;
        if (type.indexOf('?') !== -1) {
            condType = type.split('?');
            fieldBit = condType[0].split('.');
            if (!(params[fieldBit[0]] & (1 << fieldBit[1]))) {
                continue;
            }
            type = condType[1];
        }

        this.storeObject(params[param.name], type, methodName + '[' + param.name + ']');
    }

    return methodData.type;
};

TLSerialization.prototype.storeObject = function (obj, type, field) {
    switch (type) {
        case '#':
        case 'int':
            return this.storeInt(obj, field);
        case 'long':
            return this.storeLong(obj, field);
        case 'int128':
            return this.storeIntBytes(obj, 128, field);
        case 'int256':
            return this.storeIntBytes(obj, 256, field);
        case 'int512':
            return this.storeIntBytes(obj, 512, field);
        case 'string':
            return this.storeString(obj, field);
        case 'bytes':
            return this.storeBytes(obj, field);
        case 'double':
            return this.storeDouble(obj, field);
        case 'Bool':
            return this.storeBool(obj, field);
        case 'true':
            return;
    }

    if (Array.isArray(obj)) {
        if (type.substr(0, 6) == 'Vector') {
            this.writeInt(0x1cb5c415, field + '[id]');
        }
        else if (type.substr(0, 6) != 'vector') {
            throw new Error('Invalid vector type ' + type);
        }
        var itemType = type.substr(7, type.length - 8); // for "Vector<itemType>"
        this.writeInt(obj.length, field + '[count]');
        for (var i = 0; i < obj.length; i++) {
            this.storeObject(obj[i], itemType, field + '[' + i + ']');
        }
        return true;
    }
    else if (type.substr(0, 6).toLowerCase() == 'vector') {
        throw new Error('Invalid vector object');
    }

    ////if (!angular.isObject(obj)) {
    if (!(Utils.isObject(obj))) {
        throw new Error('Invalid object for type ' + type);
    }

    var schema = this.mtproto ? Config.Schema.MTProto : Config.Schema.API;
    var predicate = obj['_'];
    var isBare = false;
    var constructorData = false,
        i;

    if (isBare = (type.charAt(0) == '%')) {
        type = type.substr(1);
    }

    for (i = 0; i < schema.constructors.length; i++) {
        if (schema.constructors[i].predicate == predicate) {
            constructorData = schema.constructors[i];
            break;
        }
    }
    if (!constructorData) {
        throw new Error('No predicate ' + predicate + ' found');
    }

    if (predicate == type) {
        isBare = true;
    }

    if (!isBare) {
        this.writeInt(intToUint(constructorData.id), field + '[' + predicate + '][id]');
    }

    var param, type;
    var i, condType;
    var fieldBit;
    var len = constructorData.params.length;

    for (i = 0; i < len; i++) {
        param = constructorData.params[i];
        type = param.type;
        if (type.indexOf('?') !== -1) {
            condType = type.split('?');
            fieldBit = condType[0].split('.');
            if (!(obj[fieldBit[0]] & (1 << fieldBit[1]))) {
                continue;
            }
            type = condType[1];
        }

        this.storeObject(obj[param.name], type, field + '[' + predicate + '][' + param.name + ']');
    }

    return constructorData.type;
};