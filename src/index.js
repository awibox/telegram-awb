import {apiConfig} from 'config/api';
import TdClient from 'tdweb';

const client = new TdClient(apiConfig);
client.send({
  '@type': 'setTdlibParameters',
  api_id: apiConfig.app.id,
  api_hash: apiConfig.app.hash,
  system_language_code: navigator.language || 'en',
  use_secret_chats: false,
  use_message_database: true,
  use_file_database: false,
  database_directory: '/db',
  files_directory: '/'
});