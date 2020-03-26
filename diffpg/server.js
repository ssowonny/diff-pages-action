const express = require('express');

function runServer(basePath, port) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use('/', express.static(basePath));
    const server = require('http').createServer(app);
    server.listen(port, () => resolve(server));
  });
}

module.exports = { runServer }