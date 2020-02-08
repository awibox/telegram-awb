function CryptoWorkerModule(timeoutService) {
    return {
        sha1Hash: function (bytes) {
            return timeoutService(function () {
                return sha1HashSync(bytes);
            });
        },
        sha256Hash: function (bytes) {
            return timeoutService(function () {
                return sha256HashSync(bytes);
            });
        },
        aesEncrypt: function (bytes, keyBytes, ivBytes) {
            return timeoutService(function () {
                return convertToArrayBuffer(aesEncryptSync(bytes, keyBytes, ivBytes));
            });
        },
        aesDecrypt: function (encryptedBytes, keyBytes, ivBytes) {
            return timeoutService(function () {
                return convertToArrayBuffer(aesDecryptSync(encryptedBytes, keyBytes, ivBytes));
            });
        },
        factorize: function (bytes) {
            bytes = convertToByteArray(bytes);

            return timeoutService(function () {
                return pqPrimeFactorization(bytes);
            });
        },
        modPow: function (x, y, m) {
            return timeoutService(function () {
                return bytesModPow(x, y, m);
            });
        }
    };
}

CryptoWorkerModule.dependencies = [
    'timeoutService'
];
