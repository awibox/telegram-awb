export const set = (key, value) => localStorage.setItem(key, value);
export const get = (key) => localStorage.getItem(key);
export const setObject = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const getObject = (key) => JSON.parse(localStorage.getItem(key));
export const remove = (key) => localStorage.removeItem(key);