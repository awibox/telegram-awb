import AuthApi from 'api/AuthApi';
import { addClass, deleteClass } from 'utils/index';
import 'styles/password.scss';
import Messenger from 'modules/Messenger';

class Password {
  constructor(router, salt) {
    this.api = new AuthApi();
    this.router = router;
    this.salt = salt;
    this.showPassword = false;
  }

  sendPasswordCode(passwordCode, passwordCodeInput) {
    this.api.checkPassword(this.salt, passwordCode).then((response) => {
      console.log('this.api.checkPassword !!!!!!!!!!!', response);
      this.router.goToRoute('im.html', () => {
        const messenger = new Messenger();
        messenger.render();
      });
    }).catch((error) => {
      console.error(error);
      passwordCodeInput.className = addClass(passwordCodeInput.className, 'password__input_error');
    });
  }

  setLabel(passwordCode, passwordCodeInput, passwordEye) {
    if (passwordCode.length > 0) {
      passwordCodeInput.className = addClass(passwordCodeInput.className, 'password__input_active');
      passwordEye.style.visibility = 'visible';
      passwordEye.style.opacity = '0.5';
    } else {
      passwordCodeInput.className = deleteClass(passwordCodeInput.className, 'password__input_active');
      passwordEye.style.opacity = '0';
    }
  }

  showPasswordCode(passwordEye, passwordImg, passwordCode) {
    if (this.showPassword) {
      passwordEye.className = 'password__input-eye';
      passwordImg.className = 'password__img';
      passwordCode.type = 'password';
    } else {
      passwordEye.className = 'password__input-eye password__input-eye_active';
      passwordImg.className = 'password__img password__img_show';
      passwordCode.type = 'text';
    }
    this.showPassword = !this.showPassword;
  }

  render() {
    const passwordCodeInput = document.getElementById('passwordInput');
    const passwordEye = document.getElementById('passwordEye');
    const passwordImg = document.getElementById('passwordImg');
    const passwordCode = document.getElementById('passwordCode');
    const passwordButton = document.getElementById('passwordButton');
    passwordCodeInput.addEventListener('keyup', () => this.setLabel(passwordCode.value, passwordCodeInput, passwordEye));
    passwordButton.addEventListener('click', () => this.sendPasswordCode(passwordCode.value, passwordCodeInput));
    passwordEye.addEventListener('click', () => this.showPasswordCode(passwordEye, passwordImg, passwordCode));
  }
}

export default Password;
