import MtpApiManager from '../mtproto/mtpApiManager';
import storage from 'utils/storage';
import query from 'q';
import apiConfig from 'config/api';

class AuthApi {
  constructor() {
    this.client = new MtpApiManager();
  }

  setUser(user) {
    storage.set('auth_user', user);
  }

  getUser() {
    return storage.get('auth_user');
  }

  getCountry() {
    const deferred = query.defer();
    this.client.invokeApi('help.getNearestDc', {}, { dcID: 2, createNetworker: true })
      .then((getNearestDc) => {
        deferred.resolve(getNearestDc.country);
      }, (error) => {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  sendCode(phone) {
    const deferred = query.defer();
    const request = {
      flags: 0,
      phone_number: phone,
      api_id: apiConfig.api_id,
      api_hash: apiConfig.api_hash,
      lang_code: 'en'
    };
    this.client.invokeApi('auth.sendCode', request).then(function (sentCode) {
      deferred.resolve(sentCode);
    }, function (error) {
      deferred.reject(error);
    });
    return deferred.promise;
  }
}

export default AuthApi;
