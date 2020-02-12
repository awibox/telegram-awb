import apiConfig from 'config/api';

class AuthApi {
  constructor() {
    this.client = telegramApi;
    this.options =  { dcID: 2, createNetworker: true };
  }

  getCountry() {
    return this.client.invokeApi('help.getNearestDc', {}, this.options)
  }

  sendCode(phone) {
    const request = {
      flags: 0,
      phone_number: phone,
      api_id: apiConfig.app.id,
      api_hash: apiConfig.app.hash,
      lang_code: 'en'
    };
    return this.client.invokeApi('auth.sendCode', request, this.options);
  }
  checkConfirmCode(phoneNumber, phoneCodeHash, phoneCode) {
    return this.client.signIn(phoneNumber, phoneCodeHash, phoneCode).then((data) => {
      console.log("signIn success", data);
    }, (error) => {
      console.log('Sign In error', error);
    });
  }

  checkPassword(salt, password) {
    return this.client.checkPasswordHash(salt, password);
  }
}

export default AuthApi;
