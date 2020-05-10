const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = validateRegisterInput = data => {
  let errors = {};

  data.first_name = !isEmpty(data.first_name) ? data.first_name : '';
  data.last_name = !isEmpty(data.last_name) ? data.last_name : '';
  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.password2 = !isEmpty(data.password2) ? data.password2 : '';

  // Name validation
  if (!Validator.isLength(data.first_name, { min: 2, max: 20 })) {
    errors.first_name = 'First name must be between 2 and 30 characters';
  }

  if (Validator.isEmpty(data.first_name)) {
    errors.first_name = 'First name field is required';
  }

  if (!Validator.isLength(data.last_name, { min: 2, max: 20 })) {
    errors.last_name = 'Last name must be between 2 and 30 characters';
  }

  if (Validator.isEmpty(data.last_name)) {
    errors.last_name = 'Last name field is required';
  }

  // Email validation
  if (!Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (Validator.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  }

  // Password validation
  if (!Validator.isLength(data.password, { min: 4, max: 30 })) {
    errors.password = 'Password must be at least 4 characters';
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  if (Validator.isEmpty(data.password2)) {
    errors.password2 = 'Password field is required';
  }

  if (data.password !== data.password2) {
    errors.password2 = "Passwords don't match"
  }
  
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
