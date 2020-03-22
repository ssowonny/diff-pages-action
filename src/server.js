const express = require('express');

function runServer(basePath, headPath, port, callback) {
  const app = express();
  app.use('/base', express.static(basePath));
  app.use('/head', express.static(headPath));
  return app.listen(port, callback);
}

module.exports = { runServer }