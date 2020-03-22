const core = require('@actions/core');
const { createDiffScreenshots } = require('./src/pgdiff.js');
const { runServer } = require('./src/server.js');

const basePath = `example/base/`;
const headPath = `example/head/`;
const tempPath = `example/temp/`;
const outputPath = `example/output/`;
const port = 8000;

// const basePath = core.getInput('base-path', { required: true });
// const headPath = core.getInput('head-path', { required: true });
// const tempPath = core.getInput('temp-path', { required: true });
// const outputPath = core.getInput('output-path', { required: true });
// const port = core.getInput('port', { required: true });

var server = null;
try {
  server = runServer(basePath, headPath, port);
} catch (error) {
  core.setFailed(error.message);
}

(async () => {
  try {
    const path = await createDiffScreenshots(basePath, headPath, tempPath, outputPath, port);
    core.setOutput("path", path);
  } catch (error) {
    core.setFailed(error.message);
  }

  server.close(() => {
    console.log("Server is closed.")
    process.exit();
  });
})();
