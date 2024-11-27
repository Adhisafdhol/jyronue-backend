const { validationResult } = require("express-validator");

const handleValidationError = ({ req, res, message }) => {
  const errors = validationResult(req);

  // If error is not empty response with errors data and message
  if (!errors.isEmpty()) {
    const errorsList = errors.array().map((err) => {
      return { field: err.path, value: err.value, msg: err.msg };
    });

    return res.status(422).json({
      error: {
        message,
        errors: errorsList,
      },
    });
  }
};

module.exports = { handleValidationError };
