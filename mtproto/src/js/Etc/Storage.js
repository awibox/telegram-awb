function StorageModule($q) {
    var methods = {};

    forEach(['get', 'set', 'remove'], function (methodName) {
        if(Config.Modes.test) {
            ConfigStorage.prefix('t_');
        }
        methods[methodName] = function () {
            var deferred = $q.defer(),
                args = toArray(arguments);

            args.push(function (result) {
                deferred.resolve(result);
            });

            ConfigStorage[methodName].apply(ConfigStorage, args);

            return deferred.promise;
        };
    });

    return methods;
}

StorageModule.dependencies = [
    '$q'
];
