import * as storage from 'utils/storage';
import 'styles/registration.scss';

class Registration {
  constructor(client, state) {
    this.client = client;
    this.state = state;
    this.isReadyForSending = true;
    this.invalid = false;
  }

  onChangeName(name, nameContainer) {
    if (name.length > 0) {
      nameContainer.className = `registration__input registration__input_active ${this.invalid ? 'registration__input_error' : ''}`;
    } else {
      nameContainer.className = `registration__input ${this.invalid ? 'registration__input_error' : ''}`;
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
      this.client.send({
        '@type': 'registerUser',
        first_name: registrationNameInput.value,
        last_name: registrationLastNameInput.value,
      }).catch(() => {
        registrationName.className = 'registration__input registration__input_error';
        this.invalid = true;
      });
    }
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
  }
}
export default Registration;
