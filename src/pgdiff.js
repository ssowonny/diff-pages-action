const glob = require('glob');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const { copyDiffFiles, ensureFolderExistsSync } = require('./files');
const { runServer } = require('./server.js');

async function createDiffScreenshots(basePath, headPath, tempPath, outputPath, port, pattern) {
  const tmpHeadPath = tempPath + '/head';
  const tmpBasePath = tempPath + '/base';
  ensureFolderExistsSync(tmpBasePath);
  ensureFolderExistsSync(tmpHeadPath);

  const baseFilesCount = await captureScreenshots(basePath, tmpBasePath, pattern, port);
  console.log(`${baseFilesCount} base page screenshots are created in ${tempPath}/base`);

  const headFilesCount = await captureScreenshots(headPath, tmpHeadPath, pattern, port);
  console.log(`${headFilesCount} head page screenshots are created in ${tempPath}/head`);

  const copiedFilesCount = await copyDiffFiles(`${tempPath}/base`, `${tempPath}/head`, outputPath);
  console.log(`${copiedFilesCount} different screenshots are copied to ${outputPath}`);

  return outputPath;
}

async function captureScreenshots(inputPath, outputPath, pattern, port) {
  const server = await runServer(inputPath, port);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const files = glob.sync(`${inputPath}/${pattern}`)
    .map((file) => path.relative(inputPath, file));

  await Promise.all(files.map(async file => {
    const page = await browser.newPage();
    await page.setViewport({ width: 2048, height: 1024})
    await page.goto(`http://localhost:${port}/${file}`, { waitUntil: 'networkidle0', timeout: 20 * 1000 });
    const filePath = `${outputPath}/${file}.jpg`;
    const dir = path.dirname(filePath);
    ensureFolderExistsSync(dir);
    await page.screenshot({ path: filePath });
  }))

  await browser.close();
  await new Promise((resolve, reject) => server.close(resolve));
  return files.length;
}

module.exports = { createDiffScreenshots };