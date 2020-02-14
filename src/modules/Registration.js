import storage from 'utils/storage';
import 'styles/registration.scss';
import { addClass, deleteClass } from 'utils';
import Messenger from 'modules/Messenger';

class Registration {
  constructor(router, phoneNumber, phoneCodeHash, confirmCode) {
    this.client = telegramApi;
    this.router = router;
    this.phoneNumber = phoneNumber;
    this.phoneCodeHash = phoneCodeHash;
    this.confirmCode = confirmCode;
    this.isReadyForSending = true;
  }

  onChangeName(name, nameContainer) {
    if (name.length > 0) {
      nameContainer.className = addClass(nameContainer.className, 'registration__input_active');
    } else {
      nameContainer.className = deleteClass(nameContainer.className, 'registration__input_active');
    }
  }

  sendData(registrationSendButton, registrationName, registrationNameInput, registrationLastNameInput) {
    if (this.isReadyForSending) {
      registrationSendButton.innerText = 'Wait...';
      this.isReadyForSending = false;
      setTimeout(() => {
        this.isReadyForSending = true;
        registrationSendButton.innerText = 'Start Messaging';
      }, 3000);
      this.client.signUp(this.phoneNumber, this.phoneCodeHash, this.confirmCode, registrationNameInput.value, registrationLastNameInput.value).then(() => {
        this.router.goToRoute('im.html', () => {
          const messenger = new Messenger(this.router);
          messenger.render();
        });
      }).catch((error) => {
        console.error(error);
        registrationName.className = addClass(registrationName, 'registration__input_error');
      });
    }
  }

  onFocusName(registrationNameInput, registrationLastNameInput) {
    registrationNameInput.className = addClass(registrationNameInput.className, 'registration__input_focused');
    registrationLastNameInput.className = deleteClass(registrationLastNameInput.className, 'registration__input_focused');
  }

  onFocusLastName(registrationNameInput, registrationLastNameInput) {
    registrationNameInput.className = deleteClass(registrationNameInput.className, 'registration__input_focused');
    registrationLastNameInput.className = addClass(registrationLastNameInput.className, 'registration__input_focused');
  }

  render() {
    const registrationName = document.getElementById('registrationName');
    const registrationNameInput = document.getElementById('registrationNameInput');
    const registrationLastName = document.getElementById('registrationLastName');
    const registrationLastNameInput = document.getElementById('registrationLastNameInput');
    const registrationSendButton = document.getElementById('registrationSendButton');
    registrationNameInput.addEventListener('keyup', () => this.onChangeName(registrationNameInput.value, registrationName));
    registrationLastNameInput.addEventListener('keyup', () => this.onChangeName(registrationLastNameInput.value, registrationLastName));
    registrationSendButton.addEventListener('click', () => this.sendData(registrationSendButton, registrationName, registrationNameInput, registrationLastNameInput));
    registrationName.addEventListener('focusin', () => this.onFocusName(registrationName, registrationLastName));
    registrationLastName.addEventListener('focusin', () => this.onFocusLastName(registrationName, registrationLastName));
  }
}
export default Registration;
