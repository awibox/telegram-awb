const storage = {
  set(key, value) {
    localStorage.setItem(key, value);
  },
  get(key) {
    return localStorage.getItem(key) ? localStorage.getItem(key) : null;
  },
  setObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getObject(key) {
    return JSON.parse(localStorage.getItem(key)) ? JSON.parse(localStorage.getItem(key)) : null;
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

export default storage;
