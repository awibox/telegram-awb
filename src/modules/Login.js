import storage from 'utils/storage';
import AuthApi from 'api/AuthApi';
import 'styles/login.scss';

class Login {
  constructor() {
    this.api = new AuthApi();
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
      this.api.sendCode(phoneNumber).then((response) => {
        console.log('response', response)
      }).catch((error) => {
        console.error(error);
      })
    }
  }
  onChangePhone(phoneNumber, phoneNumberInput) {
    storage.set('phone', phoneNumber);
    if (phoneNumber.length > 0) {
      phoneNumberInput.className = `login__input login__input_active ${this.invalid ? 'login__input_error' : ''}`;
    } else {
      phoneNumberInput.className = `login__input ${this.invalid ? 'login__input_error' : ''}`;
    }
  }
  render() {
    this.api.getCountry().then((response) => {
      console.log('getCountry', response);
      const phoneNumber = document.getElementById('phoneNumber');
      const phoneNumberInput = document.getElementById('phoneInput');
      const phoneNumberSendButton = document.getElementById('phoneNumberButton');
      phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber.value, phoneNumberInput));
      phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value, phoneNumberInput, phoneNumberSendButton));
      if(storage.get('phone')) {
          phoneNumber.value = storage.get('phone');
          phoneNumberInput.className = `login__input login__input_active`;
        }
    });
  }
}
export default Login;
