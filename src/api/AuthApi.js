import storage from 'utils/storage';
import query from 'q';
import apiConfig from 'config/api';

class AuthApi {
  constructor() {
    this.client = telegramApi;
    this.options =  { dcID: 2, createNetworker: true };
  }

  setUser(user) {
    storage.setObject('auth_user', user);
  }

  getUser() {
    return storage.getObject('auth_user');
  }

  getCountry() {
    return this.client.invokeApi('help.getNearestDc', {}, this.options)

  }

  sendCode(phone) {
    const deferred = query.defer();
    const request = {
      flags: 0,
      phone_number: phone,
      api_id: apiConfig.app.id,
      api_hash: apiConfig.app.hash,
      lang_code: 'en'
    };
    this.client.invokeApi('auth.sendCode', request, this.options).then(function (sentCode) {
      deferred.resolve(sentCode);
    }, function (error) {
      deferred.reject(error);
    });
    return deferred.promise;
  }
  checkConfirmCode(phoneNumber, phoneCodeHash, phoneCode) {
    const deferred = query.defer();
    const self = this;
    const request = {
      phone_number: phoneNumber,
      phone_code_hash: phoneCodeHash,
      phone_code: phoneCode
    };

    this.client.invokeApi('auth.signIn', request, this.options).then((data) => {
      console.log("signIn success", data);
      self.setUser(data.user);
      deferred.resolve(data.user);
    }, (error) => {
      console.log('Sign In error', error);
      deferred.reject(error);
    });

    return deferred.promise;
  }

  getPasswordState() {
    const deferred = query.defer();
    this.client.invokeApi('account.getPassword', {}, this.options)
      .then((result) => {
        console.log('result', result);
        deferred.resolve(result);
      }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }

  checkPassword(salt, password) {
    return this.client.checkPasswordHash(salt, password);
  }
}

export default AuthApi;
