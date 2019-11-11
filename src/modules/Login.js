import * as storage from 'utils/storage';
import 'styles/login.scss';

class Login {
  constructor(client, state) {
    this.client = client;
    this.state = state;
    this.phoneNumberInput = '';
  }
  sendPhoneNumber(phoneNumber) {
    console.log('this.client', this.client, 'phoneNumber', phoneNumber);
    this.client.send({
      '@type': 'setAuthenticationPhoneNumber',
      phone_number: phoneNumber,
    }).then(result => {
      console.log('result', result);
      storage.set('phone', phoneNumber);
    }).catch(error => {
      console.error(error);
    });
  }
  render() {
    this.phoneNumberInput = document.getElementById('phoneNumber');
    console.log('this.phoneNumberInput', this.phoneNumberInput);
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');

    phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(this.phoneNumberInput.value));
    this.phoneNumberInput.addEventListener('keyup', () => {
      console.log('phoneNumberInput', this.phoneNumberInput.value);
      if (this.phoneNumberInput.value.length > 9) {

      }
    });
  }
}
export default Login;