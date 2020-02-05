function CryptoWorkerModule($timeout, $q) {
    return {
        sha1Hash: function (bytes) {
            var deferred = $q.defer();
            deferred.resolve(sha1HashSync(bytes));
            return deferred.promise;
        },
        sha256Hash: function (bytes) {
            var deferred = $q.defer();
            deferred.resolve(sha256HashSync(bytes));
            return deferred.promise;
        },
        aesEncrypt: function (bytes, keyBytes, ivBytes) {
            var deferred = $q.defer();
            deferred.resolve(convertToArrayBuffer(aesEncryptSync(bytes, keyBytes, ivBytes)));
            return deferred.promise;
        },
        aesDecrypt: function (encryptedBytes, keyBytes, ivBytes) {
            var deferred = $q.defer();
            deferred.resolve(convertToArrayBuffer(aesDecryptSync(encryptedBytes, keyBytes, ivBytes)));
            return deferred.promise;
        },
        factorize: function (bytes) {
            var deferred = $q.defer();
            bytes = convertToByteArray(bytes);
            deferred.resolve(pqPrimeFactorization(bytes));
            return deferred.promise;
        },
        modPow: function (x, y, m) {
            return bytesModPow(x, y, m);
        }
    };
}

CryptoWorkerModule.dependencies = [
    '$timeout',
    '$q'
];
