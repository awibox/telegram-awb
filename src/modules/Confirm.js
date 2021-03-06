import AuthApi from 'api/AuthApi';
import Password from 'modules/Password';
import Registration from 'modules/Registration';
import { addClass, deleteClass } from 'utils/index';
import 'styles/confirm.scss';
import Messenger from 'modules/Messenger';


class Confirm {
  constructor(router, phoneNumber, phoneCodeHash) {
    this.router = router;
    this.phoneNumber = phoneNumber;
    this.phoneCodeHash = phoneCodeHash;
    this.api = new AuthApi();
    this.state = {
      confirmPhone: '',
      confirmCodeInput: '',
    };
  }

  sendConfirmCode(confirmCode) {
    if (confirmCode.length > 0) {
      this.state.confirmCodeInput.className = addClass(this.state.confirmCodeInput.className, 'confirm__input_active');
    } else {
      this.state.confirmCodeInput.className = deleteClass(this.state.confirmCodeInput.className, 'confirm__input_active');
    }
    if (confirmCode.length === 5) {
      this.api.checkConfirmCode(this.phoneNumber, this.phoneCodeHash, confirmCode)
        .then(() => {
          this.router.goToRoute('im.html', () => {
            const messenger = new Messenger(this.router);
            messenger.render();
          });
        }).catch((error) => {
          if (error.type === 'SESSION_PASSWORD_NEEDED') {
            this.api.getPasswordState().then((result) => {
              this.router.goToRoute('password.html', () => {
                const password = new Password(this.router, result.current_salt);
                password.render();
              });
            });
          } else if (error.type === 'PHONE_NUMBER_UNOCCUPIED') {
            this.router.goToRoute('registration.html', () => {
              const registration = new Registration(this.router, this.phoneNumber, this.phoneCodeHash, confirmCode);
              registration.render();
            });
          } else {
            console.error(error);
            if(error.code !== 420) {
              this.state.confirmCodeInput.className = addClass(this.state.confirmCodeInput.className, 'confirm__input_error');
            }
          }
        });
    }
  }

  sendCodeForNewPhone(phoneNumber) {
    this.state.confirmPhone.style.color = '#000000';
    if (phoneNumber !== this.phoneNumber) {
      this.api.sendCode(phoneNumber).then((response) => {
        this.phoneNumber = phoneNumber;
        this.phoneCodeHash = response.phone_code_hash;
      }).catch((error) => {
        console.error(error);
        this.state.confirmPhone.style.color = '#E53834';
      });
    }
  }

  changeEventPressEnter(e) {
    if (e.keyCode === 13) {
      this.state.confirmPhone.disabled = true;
      this.sendCodeForNewPhone(this.state.confirmPhone.value);
    }
    if (this.state.confirmPhone.value.length > 4) {
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
    this.state.confirmPhone.addEventListener('focusout', () => this.changeEventFocuOut());
    this.state.confirmPhone.addEventListener('keyup', (e) => this.changeEventPressEnter(e));
  }

  render() {
    this.state.confirmPhone = document.getElementById('confirmPhone');
    this.state.confirmCodeInput = document.getElementById('confirmInput');
    const confirmCode = document.getElementById('confirmCode');
    const editPhoneNumber = document.getElementById('editPhoneNumber');
    editPhoneNumber.addEventListener('click', () => this.changePhoneNumber());
    this.state.confirmPhone.value = this.phoneNumber;
    this.state.confirmPhone.style.width = `${this.state.confirmPhone.value.length * 20}px`;
    this.state.confirmCodeInput.addEventListener('keyup', () => this.sendConfirmCode(confirmCode.value));
  }
}
export default Confirm;
