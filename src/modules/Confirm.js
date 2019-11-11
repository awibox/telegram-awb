import * as storage from 'utils/storage';
import 'styles/confirm.scss';

class Confirm {
  constructor(client, state) {
    this.client = client;
    this.state = state;
  }
  sendConfirmCode(confirmCode) {
    if (confirmCode.length === 5) {
      console.log('SENDD!!!', confirmCode);
      this.client.send({
        '@type': 'checkAuthenticationCode',
        code: confirmCode,
      }).then(result => {
        console.log('result', result);
      }).catch(error => {
        console.error(error);
      });
    }
  }
  render() {
    const confirmTitle = document.getElementById('confirmPhone');
    const confirmCodeInput = document.getElementById('confirmCode');
    confirmTitle.innerText = storage.get('phone');
    confirmCodeInput.addEventListener('keyup', () => this.sendConfirmCode(confirmCodeInput.value));
  }
}
export default Confirm;