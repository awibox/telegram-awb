const storage = {
  set: function(key, value) {
    localStorage.setItem(key, value)
  },
  get: function(key) {
    return localStorage.getItem(key) ? localStorage.getItem(key) : null;
  },
  setObject: function(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  getObject: function(key) {
    return JSON.parse(localStorage.getItem(key)) ? JSON.parse(localStorage.getItem(key)) : {};
  },
  remove: function(key) {
    localStorage.removeItem(key);
  },
  clear: function() {
    localStorage.clear()
  }
};

export default storage;
