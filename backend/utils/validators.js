// Input validation utilities
const validators = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Username validation (3-20 chars, alphanumeric + underscore)
  isValidUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  // Password validation (min 6 chars)
  isValidPassword: (password) => {
    return password && password.length >= 6;
  },

  // Phone number validation (basic)
  isValidPhone: (phone) => {
    const phoneRegex = /^[0-9]{10,}$/;
    return !phone || phoneRegex.test(phone.replace(/\D/g, ''));
  },

  // Check if string is not empty
  isNotEmpty: (str) => {
    return typeof str === 'string' && str.trim().length > 0;
  },

  // Check if number is positive
  isPositive: (num) => {
    return typeof num === 'number' && num > 0;
  },

  // Check if date is valid
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Check if value is in allowed list
  isInList: (value, list) => {
    return list.includes(value);
  },

  // Validate email structure
  validateEmail: (email) => {
    if (!email || !validators.isValidEmail(email)) {
      return 'Invalid email address';
    }
    return null;
  },

  // Validate username
  validateUsername: (username) => {
    if (!username || !validators.isValidUsername(username)) {
      return 'Username must be 3-20 characters, alphanumeric and underscores only';
    }
    return null;
  },

  // Validate password
  validatePassword: (password) => {
    if (!password || !validators.isValidPassword(password)) {
      return 'Password must be at least 6 characters';
    }
    return null;
  },

  // Validate required field
  validateRequired: (value, fieldName) => {
    if (!value) {
      return `${fieldName} is required`;
    }
    return null;
  },

  // Validate name field
  validateName: (name, fieldName = 'Name') => {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    return null;
  },

  // Validate phone
  validatePhone: (phone) => {
    if (!phone) return null; // Optional field
    if (!validators.isValidPhone(phone)) {
      return 'Invalid phone number';
    }
    return null;
  },

  // Validate meal type
  validateMealType: (mealType, mealTypes) => {
    if (!mealType || !mealTypes.includes(mealType)) {
      return `Meal type must be one of: ${mealTypes.join(', ')}`;
    }
    return null;
  },

  // Validate date format
  validateDate: (dateString) => {
    if (!dateString || !validators.isValidDate(dateString)) {
      return 'Invalid date format';
    }
    return null;
  },

  // Validate amount (positive number)
  validateAmount: (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      return 'Amount must be a positive number';
    }
    return null;
  },

  // Validate quantity (positive integer)
  validateQuantity: (quantity) => {
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num <= 0) {
      return 'Quantity must be a positive integer';
    }
    return null;
  },
};

module.exports = validators;
