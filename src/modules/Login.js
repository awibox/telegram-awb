import * as storage from 'utils/storage';
import 'styles/login.scss';

class Login {
  constructor(client, state) {
    this.client = client;
    this.state = state;
    this.isReadyForSending = true;
    this.invalid = false;
  }
  sendPhoneNumber(phoneNumber, phoneNumberInput, phoneNumberSendButton) {
    if(this.isReadyForSending) {
      phoneNumberSendButton.innerText = 'Wait...';
      this.isReadyForSending = false;
      setTimeout(() => {
        this.isReadyForSending = true;
        phoneNumberSendButton.innerText = 'NEXT';
      }, 3000);
      this.client.send({
        '@type': 'setAuthenticationPhoneNumber',
        phone_number: phoneNumber,
      }).then(result => {
        console.log('______ setAuthenticationPhoneNumber _______', result);
      }).catch(error => {
        phoneNumberInput.className = 'login__input login__input_error';
        this.invalid = true;
      });
    }
  }
  onChangePhone(phoneNumber, phoneNumberInput) {
    console.log('phoneNumber', phoneNumber);
    storage.set('phone', phoneNumber);
    if (phoneNumber.length > 0) {
      phoneNumberInput.className = `login__input login__input_active ${this.invalid ? 'login__input_error' : ''}`;
    } else {
      phoneNumberInput.className = `login__input ${this.invalid ? 'login__input_error' : ''}`;
    }
  }
  render() {
    const phoneNumber = document.getElementById('phoneNumber');
    const phoneNumberInput = document.getElementById('phoneInput');
    const phoneNumberSendButton = document.getElementById('phoneNumberButton');
    if(storage.get('phone')) {
      phoneNumber.value = storage.get('phone');
      phoneNumberInput.className = `login__input login__input_active`;
    }
    phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value, phoneNumberInput, phoneNumberSendButton));
    phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber.value, phoneNumberInput));

  }
}
export default Login;