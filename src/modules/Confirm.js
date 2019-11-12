import * as storage from 'utils/storage';
import 'styles/confirm.scss';

class Confirm {
  constructor(client, state) {
    this.client = client;
    this.state = state;
    this.confirmCodeInput = '';
    this.invalid = false;
  }
  sendConfirmCode(confirmCode) {
    if(confirmCode.length > 0) {
      this.confirmCodeInput.className = `confirm__input confirm__input_active ${this.invalid ? 'confirm__input_error' : ''}`;
    } else {
      this.confirmCodeInput.className = `confirm__input ${this.invalid ? 'confirm__input_error' : ''}`;
    }
    if (confirmCode.length === 5) {
      console.log('SENDD!!!', confirmCode);
      this.client.send({
        '@type': 'checkAuthenticationCode',
        code: confirmCode,
      }).then(result => {
        console.log('result', result);
      }).catch(error => {
        this.confirmCodeInput.className = 'confirm__input confirm__input_error';
        this.invalid = true;
      });
    }
  }
  render() {
    const confirmTitle = document.getElementById('confirmPhone');
    this.confirmCodeInput = document.getElementById('confirmInput');
    const confirmCode = document.getElementById('confirmCode');
    confirmTitle.innerText = storage.get('phone');
    this.confirmCodeInput.addEventListener('keyup', () => this.sendConfirmCode(confirmCode.value));
  }
}
export default Confirm;