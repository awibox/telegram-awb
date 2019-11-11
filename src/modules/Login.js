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
  onChangePhone(phoneNumber) {
    console.log('phoneNumber', phoneNumber.value);
    if (phoneNumber.value.length > 0) {
      this.phoneNumberInput.className = `login__input login__input_active`;
    } else {
      this.phoneNumberInput.className = `login__input`;
    }
  }
  render() {
    this.phoneNumberInput = document.getElementById('phoneInput');
    const phoneNumber = document.getElementById('phoneNumber');
    console.log('this.phoneNumberInput', this.phoneNumberInput);
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');

    phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value));
    phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber));
  }
}
export default Login;