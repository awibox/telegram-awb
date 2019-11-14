import 'styles/password.scss';

class Password {
  constructor(client, state) {
    this.client = client;
    this.state = state;
    this.showPassword = false;
    this.invalid = false;
  }
  sendPasswordCode(passwordCode, passwordCodeInput) {
    console.log('SENDD PASS!!!', passwordCode);
    this.client.send({
      '@type': 'checkAuthenticationPassword',
      password: passwordCode,
    }).then(result => {
      console.log('result', result);
    }).catch(() => {
      passwordCodeInput.className = 'password__input password__input_error';
      this.invalid = true;
    });
  }
  setLabel(passwordCode, passwordCodeInput, passwordEye) {
    if(passwordCode.length > 0) {
      passwordCodeInput.className = `password__input password__input_active ${this.invalid ? 'password__input_error' : ''}`;
      passwordEye.style.visibility = 'visible';
      passwordEye.style.opacity = '0.5';
    } else {
      passwordCodeInput.className = `password__input ${this.invalid ? 'password__input_error' : ''}`;
      passwordEye.style.opacity = '0';
    }
  }
  showPasswordCode(passwordEye, passwordImg, passwordCode) {
    console.log('showPasswordCode');
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