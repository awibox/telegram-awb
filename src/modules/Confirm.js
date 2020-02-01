import { Countries, addClass, deleteClass } from 'utils/index';
import AuthApi from 'api/AuthApi';
import storage from 'utils/storage';
import 'styles/confirm.scss';

class Confirm {
  constructor(router) {
    this.router = router;
    this.api = new AuthApi();
    this.confirmCodeInput = '';
    this.invalid = false;
    this.state = {

    }
  }
  sendConfirmCode(confirmCode) {
    if(confirmCode.length > 0) {
      this.confirmCodeInput.className = addClass(this.confirmCodeInput.className, 'confirm__input_active');
    } else {
      this.confirmCodeInput.className = deleteClass(this.confirmCodeInput.className, 'confirm__input_active');
    }
    if (confirmCode.length === 5) {
      console.log("WORRRRKK!K!!!!")
      // this.client.send({
      //   '@type': 'checkAuthenticationCode',
      //   code: confirmCode,
      // }).catch(() => {
      //   this.confirmCodeInput.className = 'confirm__input confirm__input_error';
      //   this.invalid = true;
      // });
    }
  }

  sendCodeForNewPhone(phoneNumber) {
    this.state.confirmPhone.style.color = '#000000';
    if(phoneNumber !== storage.get('phone')) {
      this.api.sendCode(phoneNumber).then((response) => {
        console.log('sendPhoneNumber', response);
      }).catch((error) => {
        console.error(error);
        this.state.confirmPhone.style.color = '#E53834';
      })
    }
  }

  changeEventPressEnter(e) {
    if(e.keyCode === 13) {
      this.state.confirmPhone.disabled = true;
      this.sendCodeForNewPhone(this.state.confirmPhone.value);
    }
    if(this.state.confirmPhone.value.length > 4) {
      this.state.confirmPhone.style.width = `${this.state.confirmPhone.value.length * 20}px`;
    }
  }

  changeEventFocuOut() {
    this.state.confirmPhone.disabled = true;
    this.sendCodeForNewPhone(this.state.confirmPhone.value);
  }

  changePhoneNumber() {
    this.state.confirmPhone.disabled = false;
    this.state.confirmPhone.focus();
    this.state.confirmPhone.selectionStart = this.state.confirmPhone.value.length;
    this.state.confirmPhone.addEventListener("focusout", () => this.changeEventFocuOut());
    this.state.confirmPhone.addEventListener("keyup", (e) => this.changeEventPressEnter(e));

  }

  render() {
    console.log('Start render');
    this.state.confirmPhone = document.getElementById('confirmPhone');
    this.confirmCodeInput = document.getElementById('confirmInput');
    const confirmCode = document.getElementById('confirmCode');
    const editPhoneNumber = document.getElementById('editPhoneNumber');
    editPhoneNumber.addEventListener('click', () => this.changePhoneNumber());
    this.state.confirmPhone.value = storage.get('phone');
    this.state.confirmPhone.style.width = `${this.state.confirmPhone.value.length * 20}px`;
    this.confirmCodeInput.addEventListener('keyup', () => this.sendConfirmCode(confirmCode.value));
    console.log('Start render end');
  }
}
export default Confirm;
