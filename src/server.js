const express = require('express');

function runServer(basePath, headPath, port) {
  const app = express();
  app.use('/base', express.static(basePath));
  app.use('/head', express.static(headPath));
  return app.listen(port, function () {
    console.log('Server listening on port ' + port);
  });
}

module.exports = { runServer }