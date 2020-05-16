export function getRandomInt(ceil) {
  return Math.floor(Math.random() * Math.floor(ceil));
}

export function generateRandomEmail() {
  const EMAIL_LEN = 28;
  const CHAR_SET =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let email = "";
  while (email.length < EMAIL_LEN) {
    email += CHAR_SET[getRandomInt(CHAR_SET.length)];
  }
  return email + "@cloud9.com";
}