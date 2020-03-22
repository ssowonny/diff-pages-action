const core = require('@actions/core');
const { createDiffScreenshots } = require('./src/pgdiff.js');
const { runServer } = require('./src/server.js');

const oldPath = `example/old-path/`;
const newPath = `example/new-path/`;
const tempPath = `example/temp-path/`;
const outputPath = `example/output-path/`;
const port = 8000;

// const oldPath = core.getInput('old-path', { required: true });
// const newPath = core.getInput('new-path', { required: true });
// const tempPath = core.getInput('temp-path', { required: true });
// const outputPath = core.getInput('output-path', { required: true });
// const port = core.getInput('port', { required: true });

var server = null;
try {
  server = runServer(oldPath, newPath, port);
} catch (error) {
  core.setFailed(error.message);
}

(async () => {
  try {
    const path = await createDiffScreenshots(oldPath, newPath, tempPath, outputPath, port);
    core.setOutput("path", path);
  } catch (error) {
    core.setFailed(error.message);
  }

  server.close(() => {
    console.log("Server is closed.")
    process.exit();
  });
})();
