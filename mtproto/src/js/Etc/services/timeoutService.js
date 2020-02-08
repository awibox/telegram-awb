function timeoutServiceModule(queryService) {
    var timeout = function (cb, t) {
        var defer = queryService.defer();
        var promise = defer.promise;

        promise.__timeoutID = setTimeout(function () {
            defer.resolve(cb());
        }, t || 0);

        return promise;
    };

    timeout.cancel = function (promise) {
        if (!promise) {
            return;
        }

        clearTimeout(promise.__timeoutID);
    };

    return timeout;
}

timeoutServiceModule.dependencies = [
    'queryService'
];
