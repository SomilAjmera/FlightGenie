const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(err); // Log the error for debugging
      res.send(500, { error: err.message });
  });
};

module.exports = catchAsync;
