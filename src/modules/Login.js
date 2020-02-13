import AuthApi from 'api/AuthApi';
import Confirm from 'modules/Confirm';
import { Countries, addClass, deleteClass } from 'utils/index';
import 'styles/login.scss';

class Login {
  constructor(router) {
    this.router = router;
    this.api = new AuthApi();
    this.isReadyForSending = true;
    this.state = {
      countryId: '',
      countryInput: '',
      phoneNumber: '',
      phoneNumberInput: '',
      phoneNumberSendButton: '',
      countryArrow: '',
    };
  }

  sendPhoneNumber(phoneNumber) {
    if (this.isReadyForSending) {
      this.state.phoneNumberSendButton.innerText = 'PLEASE WAIT...';
      this.isReadyForSending = false;
      setTimeout(() => {
        this.isReadyForSending = true;
        this.state.phoneNumberSendButton.innerText = 'NEXT';
      }, 3000);
      this.api.sendCode(phoneNumber).then((response) => {
        const phoneCodeHash = response.phone_code_hash;
        const answerType = response._;
        this.router.goToRoute('confirm.html', () => {
          const confirm = new Confirm(this.router, phoneNumber, phoneCodeHash, answerType);
          confirm.render();
        });
      }).catch((error) => {
        this.state.phoneNumberInput.className = addClass(this.state.phoneNumberInput.className, 'login__input_error');
      });
    }
  }

  onChangePhone(phoneNumber) {
    if (phoneNumber.length > 0) {
      this.state.phoneNumberInput.className = addClass(this.state.phoneNumberInput.className, 'login__input_active');
    } else {
      this.state.phoneNumberInput.className = deleteClass(this.state.phoneNumberInput.className, 'login__input_active');
    }
    if (phoneNumber.length > 2) {
      this.state.phoneNumberSendButton.className = addClass(this.state.phoneNumberSendButton.className, 'show');
    } else {
      this.state.phoneNumberSendButton.className = deleteClass(this.state.phoneNumberSendButton.className, 'show');
    }
  }

  showCountriesList() {
    this.state.countryArrow.className = addClass(this.state.countryArrow.className, 'active');
    this.countryBox(this.state.countryId.value);
    const countryList = document.getElementById('countriesList');
    countryList.className = 'countriesList show';
    const closeZone = document.getElementById('closeZone');
    closeZone.className = 'closeZone show';
    closeZone.addEventListener('click', () => this.hideCountriesList());
  }

  hideCountriesList() {
    this.state.countryArrow.className = deleteClass(this.state.countryArrow.className, 'active');
    const countryList = document.getElementById('countriesList');
    countryList.className = 'countriesList';
    const closeZone = document.getElementById('closeZone');
    closeZone.className = 'closeZone';
  }

  setCountry(name, code) {
    this.state.countryId.value = name;
    this.state.phoneNumber.value = code;
    this.countryBox(name);
    this.onChangePhone(code);
    this.hideCountriesList();
  }

  getDefaultCountry(code) {
    Countries.forEach((item) => {
      if (item.code === code) {
        this.setCountry(item.name, item.dial_code);
      }
    });
  }

  countryBox(countryName) {
    if (countryName.length > 0) {
      this.state.countryInput.className = addClass(this.state.countryInput.className, 'login__input_active');
    } else {
      this.state.countryInput.className = deleteClass(this.state.countryInput.className, 'login__input_active');
    }
    const countryList = document.getElementById('countriesList');
    countryList.innerHTML = '';
    let count = 0;
    Countries.forEach((item) => {
      if (item.name.toLocaleLowerCase().indexOf(countryName.toLocaleLowerCase()) > -1) {
        const countryItem = document.createElement('div');
        countryItem.className = 'countryItem';
        countryItem.innerHTML = `<div class="flag">${item.emoji ? item.emoji : ''}</div>
           <div class='name'>${item.name}</div>
           <div class='code'>${item.dial_code}</div>`;
        countryItem.addEventListener('click', () => this.setCountry(item.name, item.dial_code));
        countryList.append(countryItem);
        count++;
      }
    });
    if (count === 0) {
      const countryItem = document.createElement('div');
      countryItem.className = 'countryItem';
      countryItem.innerHTML = '<div class="name">Nothing found</div>';
      countryList.append(countryItem);
    }
  }

  onFocusCountry() {
    this.state.countryInput.className = addClass(this.state.countryInput.className, 'login__input_focused');
    this.state.phoneNumberInput.className = deleteClass(this.state.phoneNumberInput.className, 'login__input_focused');
    this.showCountriesList();
  }

  onFocusPhone() {
    this.state.phoneNumberInput.className = addClass(this.state.phoneNumberInput.className, 'login__input_focused');
    this.state.countryInput.className = deleteClass(this.state.countryInput.className, 'login__input_focused');
  }

  getCountryFromApi() {
    console.log('getCountryFromApi');
    this.api.getCountry().then((response) => {
      console.log('response', response);
      this.getDefaultCountry(response.country);
    }).catch((error) => {
      console.log('error', error);
      setTimeout(() => this.getCountryFromApi(), 300);
    })
  }

  render() {
    this.state.countryId = document.getElementById('countryId');
    this.state.countryInput = document.getElementById('countryInput');
    this.state.phoneNumber = document.getElementById('phoneNumber');
    this.state.phoneNumberInput = document.getElementById('phoneInput');
    this.state.phoneNumberSendButton = document.getElementById('phoneNumberButton');
    this.state.phoneNumber.addEventListener('keyup', () => this.onChangePhone(phoneNumber.value));
    this.state.countryId.addEventListener('keyup', () => this.countryBox(this.state.countryId.value));
    this.state.countryId.addEventListener('focusin', () => this.onFocusCountry());
    this.state.phoneNumber.addEventListener('focusin', () => this.onFocusPhone());
    this.state.phoneNumberSendButton.addEventListener('click', () => this.sendPhoneNumber(phoneNumber.value));
    this.state.countryArrow = document.getElementById('countryArrow');
    this.getCountryFromApi();
  }
}
export default Login;
