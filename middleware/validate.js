function requiredFields(fields) {
  return function (req, res, next) {
    const missing = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(',')}` });
    }
    next();
  };
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

module.exports = { requiredFields, validateEmail };
