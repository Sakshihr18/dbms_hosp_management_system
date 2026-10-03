function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with this value already exists.' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Related record was not found.' });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong on the server.',
  });
}

module.exports = errorHandler;
