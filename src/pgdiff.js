const glob = require('glob');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const { copyDiffFiles } = require('./files');

async function createDiffScreenshots(basePath, headPath, tempPath, outputPath, port, pattern) {
  const tmpHeadPath = tempPath + '/head';
  const tmpBasePath = tempPath + '/base';

  // TODO: Modularize the folder creation.
  if (!fs.existsSync(tmpHeadPath)) {
    fs.mkdirSync(tmpHeadPath, { recursive: true });
  }
  if (!fs.existsSync(tmpBasePath)) {
    fs.mkdirSync(tmpBasePath, { recursive: true });
  }

  await Promise.all([
    captureScreenshots(`http://localhost:${port}/head/`, headPath, tmpHeadPath, pattern),
    captureScreenshots(`http://localhost:${port}/base/`, basePath, tmpBasePath, pattern),
  ]);

  // TODO: Print the number of created screenshots.
  console.log(`Base page screenshots are created in ${tempPath}/base`);
  console.log(`Head page screenshots are created in ${tempPath}/head`);

  await copyDiffFiles(`${tempPath}/base`, `${tempPath}/head`, outputPath);
  console.log(`Different screenshots are copied to ${outputPath}`);

  return outputPath;
}

async function captureScreenshots(rootUrl, inputPath, outputPath, pattern) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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