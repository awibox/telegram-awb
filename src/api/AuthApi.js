import storage from 'utils/storage';
import query from 'q';
import apiConfig from 'config/api';

class AuthApi {
  constructor() {
    this.client = telegramApi;
  }

  setUser(user) {
    storage.setObject('auth_user', user);
  }

  getUser() {
    return storage.getObject('auth_user');
  }

  getCountry() {
    return this.client.invokeApi('help.getNearestDc');
  }

  sendCode(phone) {
    return this.client.sendCode(phone);
  }

  checkConfirmCode(phoneNumber, phoneCodeHash, phoneCode) {
    return this.client.signIn(phoneNumber, phoneCodeHash, phoneCode);
  }

  getPasswordState() {
    const deferred = query.defer();
    const options = { dcID: 2, createNetworker: true };
    this.client.invokeApi('account.getPassword', {}, options)
      .then((result) => {
        deferred.resolve(result);
      }).catch((error) => {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  checkPassword(salt, password) {
    const deferred = query.defer();

    this.client.makePasswordHash(salt, password).then((passwordHash) => {
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
