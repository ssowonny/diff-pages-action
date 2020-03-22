const glob = require('glob');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const { copyDiffFiles } = require('./files');

async function createDiffScreenshots(oldPath, newPath, tempPath, outputPath, port) {
  await Promise.all([
    captureScreenshots(`http://localhost:${port}/new/`, newPath, tempPath + '/new'),
    captureScreenshots(`http://localhost:${port}/old/`, oldPath, tempPath + '/old'),
  ]);
  console.log(`Old page screenshots are created in ${tempPath}/old`);
  console.log(`New page screenshots are created in ${tempPath}/new`);

  await copyDiffFiles(`${tempPath}/old`, `${tempPath}/new`, outputPath);
  console.log(`Different screenshots are copied to ${outputPath}`);
  return outputPath;
}

async function captureScreenshots(rootUrl, inputPath, outputPath, pattern = "**/*.+(htm|html)") {
  const browser = await puppeteer.launch();
  const files = glob.sync(`${inputPath}/${pattern}`)
    .map((file) => path.relative(inputPath, file));

  await Promise.all(files.map(async file => {
    const page = await browser.newPage();
    await page.goto(`${rootUrl}/${file}`);
    const filePath = `${outputPath}/${file}.jpg`;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    await page.screenshot({ path: filePath });
  }));
}

module.exports = { createDiffScreenshots };