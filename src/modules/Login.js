import * as storage from 'utils/storage';
import 'styles/login.scss';

class Login {
  constructor(client, state) {
    this.client = client;
    this.state = state;
  }
  sendPhoneNumber(phoneNumber) {
    console.log('this.client', this.client, 'phoneNumber', phoneNumber);
    this.client.send({
      '@type': 'setAuthenticationPhoneNumber',
      phone_number: phoneNumber,
    }).then(result => {
      console.log('______ setAuthenticationPhoneNumber _______', result);
    }).catch(error => {
      console.error(error);
    });
  }
  onChangePhone(phoneNumber, phoneNumberInput) {
    console.log('phoneNumber', phoneNumber);
    storage.set('phone', phoneNumber);
    if (phoneNumber.length > 0) {
      phoneNumberInput.className = `login__input login__input_active`;
    } else {
      phoneNumberInput.className = `login__input`;
    }
  }
  render() {
    const phoneNumberInput = document.getElementById('phoneInput');
    const phoneNumber = document.getElementById('phoneNumber');
    if(storage.get('phone')) {
      phoneNumber.value = storage.get('phone');
    }
    console.log('this.phoneNumberInput', this.phoneNumberInput);
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');

    phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value));
    phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber.value, phoneNumberInput));
  }
}
export default Login;