import AuthApi from 'api/AuthApi';
import { Countries } from 'utils/index';
import 'styles/login.scss';

class Login {
  constructor() {
    this.api = new AuthApi();
    this.isReadyForSending = true;
    this.invalid = false;
    this.state = {
      countryId: '',
      phoneNumber: '',
    }
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
    if (phoneNumber.length > 0) {
      phoneNumberInput.className = `login__input login__input_active ${this.invalid ? 'login__input_error' : ''}`;
    } else {
      phoneNumberInput.className = `login__input ${this.invalid ? 'login__input_error' : ''}`;
    }
  }

  showCountriesList() {
    this.countryBox(this.state.countryId.value);
    const countryList = document.getElementById('countriesList');
    countryList.className = 'countriesList show';
    const closeZone = document.getElementById('closeZone');
    closeZone.className = 'closeZone show';
    closeZone.addEventListener('click', () => this.hideCountriesList());
  }

  hideCountriesList() {
    const countryList = document.getElementById('countriesList');
    countryList.className = 'countriesList';
    const closeZone = document.getElementById('closeZone');
    closeZone.className = 'closeZone';
  }

  setCountry(name, code) {
    this.state.countryId.value = name;
    this.state.phoneNumber.value = code;
    this.hideCountriesList()
  }

  countryBox(countryName) {
    const countryList = document.getElementById('countriesList');
    countryList.innerHTML = '';
    let count = 0;
    Countries.forEach((item) => {
      if(item.name.toLocaleLowerCase().indexOf(countryName.toLocaleLowerCase()) > -1) {
        const countryItem = document.createElement('div');
        countryItem.className = 'countryItem';
        countryItem.innerHTML = `
<div class="flag">${item.emoji ? item.emoji : ''}</div>
<div class='name'>${item.name}</div>
<div class='code'>${item.dial_code}</div>`;
        countryItem.addEventListener('click', () => this.setCountry(item.name, item.dial_code));
        countryList.append(countryItem);
        count++;
      }
    });
    if(count === 0) {
      const countryItem = document.createElement('div');
      countryItem.className = 'countryItem';
      countryItem.innerHTML = `<div class="name">Nothing found</div>`;
      countryList.append(countryItem);
    }
  }

  render() {
    this.api.getCountry().then((response) => {
      console.log('getCountry', response);
      this.state.countryId = document.getElementById('countryId');
      const countryInput = document.getElementById('countryInput');
      this.state.phoneNumber = document.getElementById('phoneNumber');
      const phoneNumberInput = document.getElementById('phoneInput');
      const phoneNumberSendButton = document.getElementById('phoneNumberButton');
      this.state.phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber.value, phoneNumberInput));
      this.state.countryId.addEventListener('keyup', () => this.countryBox(this.state.countryId.value, countryInput));
      this.state.countryId.addEventListener('focusin', () => this.showCountriesList());
      phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value, phoneNumberInput, phoneNumberSendButton));
    });
  }
}
export default Login;
