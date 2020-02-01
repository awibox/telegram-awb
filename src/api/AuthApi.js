import MtpApiManager from '../mtproto/mtpApiManager';
import storage from 'utils/storage';
import query from 'q';
import apiConfig from 'config/api';

class AuthApi {
  constructor() {
    this.client = new MtpApiManager();
  }

  setUser(user) {
    storage.setObject('auth_user', user);
  }

  getUser() {
    return storage.getObject('auth_user');
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
  checkConfirmCode(phoneNumber, phoneCodeHash, phoneCode) {
    const deferred = query.defer();
    const self = this;
    const request = {
      phone_number: phoneNumber,
      phone_code_hash: phoneCodeHash,
      phone_code: phoneCode
    };

    this.client.invokeApi('auth.signIn', request).then((data) => {
      console.log("signIn success", data);
      self.setUser(data.user);
      ////self.mtpApiManager.setUserAuth(self.dcID, data.user.id);
      deferred.resolve(data.user);
    }, (error) => {
      console.log('Sign In error', error);
      deferred.reject(error);
    });

    return deferred.promise;
  }
  checkPassword(password) {
    const deferred = query.defer();
    console.log('password', password);
    this.client.makePasswordHash(password).then((passwordHash) => {
      console.log('passwordHash', passwordHash);
      this.client.invokeApi('auth.checkPassword', { password_hash: passwordHash }).then(() => {
        console.log('check password success');
        deferred.resolve();
      }, (error) => {
        console.log('check password error', error);
        deferred.reject(error);
      });
    });

    return deferred.promise;
  }
}

export default AuthApi;
