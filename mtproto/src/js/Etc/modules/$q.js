function $qModule($) {

    var arr = [];

    var slice = arr.slice;

    function adoptValue( value, resolve, reject, noValue ) {
        var method;
        try {
            if ( value && isFunction( ( method = value.promise ) ) ) {
                method.call( value ).done( resolve ).fail( reject );
            } else if ( value && isFunction( ( method = value.then ) ) ) {
                method.call( value, resolve, reject );
            } else {
                resolve.apply( undefined, [ value ].slice( noValue ) );
            }
        } catch ( value ) {
            reject.apply( undefined, [ value ] );
        }
    }
    function when ( singleValue ) {
        var remaining = arguments.length,
          i = remaining,
          resolveContexts = Array( i ),
          resolveValues = slice.call( arguments ),
          master = Q.defer(),
          updateFunc = function( i ) {
              return function( value ) {
                  resolveContexts[ i ] = this;
                  resolveValues[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
                  if ( !( --remaining ) ) {
                      master.resolveWith( resolveContexts, resolveValues );
                  }
              };
          };

        // Single- and empty arguments are adopted like Promise.resolve
        if ( remaining <= 1 ) {
            adoptValue( singleValue, master.done( updateFunc( i ) ).resolve, master.reject,
              !remaining );

            // Use .then() to unwrap secondary thenables (cf. gh-3000)
            if ( master.state() === "pending" ||
              isFunction( resolveValues[ i ] && resolveValues[ i ].then ) ) {

                return master.then();
            }
        }

        // Multiple arguments are aggregated like Promise.all array elements
        while ( i-- ) {
            adoptValue( resolveValues[ i ], updateFunc( i ), master.reject );
        }

        return master.promise();
    }
    return {
        defer: function () {
            return Q.defer();
        },
        when:  $.when,
        reject: function (result) {
            return this.defer().reject(result);
        },
        all: function (promises) {
            if (isArray(promises)) {
                return this.when.apply(Q, promises);
            }

            var p = [];
            var keys = Object.keys(promises);

            forEach(keys, function (key) {
                p.push(promises[key]);
            });

            return this.all(p).then(function () {
                var objects = toArray(arguments);
                var result = {};

                forEach(keys, function (key, i) {
                    result[key] = objects[i];
                });

                return result;
            });
        }
    };
}

$qModule.dependencies = [
    'jQuery'
];
