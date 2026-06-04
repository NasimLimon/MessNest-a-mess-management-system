const validators = require('../utils/validators');
const responses = require('../utils/responses');

// Middleware to validate request body fields
const validateBody = (schema) => {
  return (req, res, next) => {
    const errors = {};

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required
      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (!value) continue; // Skip optional fields that are empty

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors[field] = `${field} must be of type ${rules.type}`;
        continue;
      }

      // Check length/min
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }

      // Check max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
        continue;
      }

      // Check custom validator
      if (rules.validator) {
        const error = rules.validator(value);
        if (error) {
          errors[field] = error;
        }
      }

      // Check if value is in allowed list
      if (rules.enum && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return responses.badRequest(res, 'Validation failed', errors);
    }

    next();
  };
};

// Middleware to validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query[field];

      if (rules.required && !value) {
        errors[field] = `${field} is required`;
      }

      if (value && rules.enum && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return responses.badRequest(res, 'Query validation failed', errors);
    }

    next();
  };
};

// Middleware to validate URL parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.params[field];

      if (rules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }

      if (value && rules.type === 'number' && isNaN(parseInt(value))) {
        errors[field] = `${field} must be a number`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return responses.badRequest(res, 'Parameter validation failed', errors);
    }

    next();
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
};
