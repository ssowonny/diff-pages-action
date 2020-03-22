const express = require('express');

function runServer(oldPath, newPath, port) {
  const app = express();
  app.use('/old', express.static(oldPath));
  app.use('/new', express.static(newPath));
  return app.listen(port, function () {
    console.log('Server listening on port ' + port);
  });
}

module.exports = { runServer }