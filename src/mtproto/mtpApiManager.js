import MtpAuthorizer from './mtpAuthorizer';
import { bytesFromHex, bytesToHex, bufferConcat } from './bin_utils';
import { MtpNetworkerFactory } from './mtpNetworkFactory';
import $q from 'q';
import Storage from '../storageService';
import CryptoWorker from './cryptoWorker';
// import Utils from '../utils';

const storage = new Storage();
const cryptoWorker = new CryptoWorker();
const mtpAuthorizer = new MtpAuthorizer();
const mtpNetworkerFactory = new MtpNetworkerFactory();

export default function MtpApiManager() {

  var dcID = storage.get('dc') || 2;
  var baseDcID = dcID;

  function mtpSetUserAuth(dcID, userAuth) {
    storage.set(`dc${dcID}_auth_key`, userAuth);
  }

  function mtpLogOut() {
    mtpInvokeApi('auth.logOut', {}, { dcID: dcID, ignoreErrors: true }).finally(() => {
      storage.clear();
      location.hash = '/signin';
    });
  }

  function mtpGetNetworker(dcID, options) {
    options = options || {};

    if (!dcID) {
      throw new Exception('get Networker without dcID');
    }

    var akk = `dc${dcID}_auth_key`;
    var ssk = `dc${dcID}_server_salt`;

    //// get cached networker
    var authKeyHex = storage.get(akk);
    var serverSaltHex = storage.get(ssk);

    if (authKeyHex && authKeyHex.length == 512) {

      function getPromise() {
        var promise = $q.defer();
        promise.resolve();
        return promise.promise;
      }

      var resPromise = getPromise().then(function (dcID) {

        if (!serverSaltHex || serverSaltHex.length != 16) {
          serverSaltHex = 'AAAAAAAAAAAAAAAA';
        }

        var authKey = bytesFromHex(authKeyHex);
        var serverSalt = bytesFromHex(serverSaltHex);

        var res = mtpNetworkerFactory.getNetworker(dcID, authKey, serverSalt, options);

        return res;

      }, function (error) {
        console.log('Get networker error', error, error.stack);
        return $q.reject(error);
      });

      return resPromise;
    }

    if (!options.createNetworker) {
      return $q.reject({ error_message: 'AUTH_KEY_EMPTY', error_code: 401 });
    }

    //// authorize and get networker
    var resuPromise = mtpAuthorizer.auth(dcID).then(function (auth) {

      storage.set(akk, bytesToHex(auth.authKey));
      storage.set(ssk, bytesToHex(auth.serverSalt));

      var res = mtpNetworkerFactory.getNetworker(dcID, auth.authKey, auth.serverSalt, options);

      return res;

    }, function (error) {
      console.log('Get networker error', error, error.stack);
      return $q.reject(error);
    });

    return resuPromise;
  }

  function mtpInvokeApi(method, params, options) {
    options = options || {};

    var deferred = $q.defer();

    var rejectPromise = function (error) {
      deferred.reject(error);
    };

    var performRequest = function (networker) {
      var performRequestPromise = (networker).wrapApiCall(method, params, options);

      return performRequestPromise.then(
        function (result) {
          deferred.resolve(result);
        },
        function (error) {
          rejectPromise(error);
        });
    };

    mtpGetNetworker(dcID || 2, options).then(performRequest, rejectPromise);

    return deferred.promise;
  }

  function mtpGetUserID() {
    let auth = storage.get('user_auth');
    return auth && auth.id ? auth.id : 0;
  }

  function getBaseDcID() {
    return baseDcID || false;
  }

  function makePasswordHash (salt, password) {
    var passwordUTF8 = unescape(encodeURIComponent(password));

    var buffer = new ArrayBuffer(passwordUTF8.length);
    var byteView = new Uint8Array(buffer);
    for (var i = 0, len = passwordUTF8.length; i < len; i++) {
      byteView[i] = passwordUTF8.charCodeAt(i);
    }
    console.log('salt', salt);
    console.log('byteView', byteView);
    buffer = bufferConcat(bufferConcat(salt, byteView), salt);

    return cryptoWorker.sha256Hash(buffer);
  }

  // function makePasswordHash (salt, password) {
  //   console.log('salt, password', salt, password)
  //   var passwordUTF8 = unescape(encodeURIComponent(password))
  //
  //   var buffer = new ArrayBuffer(passwordUTF8.length);
  //   var byteView = new Uint8Array(buffer);
  //   for (var i = 0, len = passwordUTF8.length; i < len; i++) {
  //     byteView[i] = passwordUTF8.charCodeAt(i)
  //   }
  //
  //   buffer = bufferConcat(bufferConcat(salt, byteView), salt)
  //   console.log('buffer', buffer);
  //   console.log('CryptoWorker.sha256Hash(buffer)', CryptoWorker.sha256Hash(buffer))
  //   return CryptoWorker.sha256Hash(buffer)
  // }

  return {
    getBaseDcID: getBaseDcID,
    getUserID: mtpGetUserID,
    invokeApi: mtpInvokeApi,
    getNetworker: mtpGetNetworker,
    setUserAuth: mtpSetUserAuth,
    logOut: mtpLogOut,
    makePasswordHash: makePasswordHash
  };
};
