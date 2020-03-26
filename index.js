const core = require('@actions/core');
const { createDiffScreenshots } = require('./diffpg');

const basePath = core.getInput('base-path', { required: true });
const headPath = core.getInput('head-path', { required: true });
const tempPath = core.getInput('temp-path', { required: true });
const outputPath = core.getInput('output-path', { required: true });
const port = core.getInput('port', { required: true });
const pattern = core.getInput('pattern', { required: true });

(async () => {
  try {
    const path = await createDiffScreenshots(basePath, headPath, tempPath, outputPath, port, pattern);
    core.setOutput("path", path);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
