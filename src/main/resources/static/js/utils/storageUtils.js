// /js/utils/storageUtils.js
const USER_KEY = "username";

export function saveUser(username) {
    localStorage.setItem(USER_KEY, username);
}

export function getUser() {
    return localStorage.getItem(USER_KEY);
}

export function clearUser() {
    localStorage.removeItem(USER_KEY);
}

export function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export function loadJSON(key) {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
}
