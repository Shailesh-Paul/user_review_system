export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password) => {
  // 8-16 characters, at least one uppercase letter, and one special character.
  const regex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/;
  return regex.test(password);
};
