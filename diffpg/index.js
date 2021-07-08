const glob = require('glob');
const puppeteer = require('puppeteer');
const path = require('path');
const { copyDiffFiles, ensureFolderExistsSync } = require(path.join(__dirname, 'files'));
const { runServer } = require(path.join(__dirname, 'server'));

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
  const browser = await puppeteer.launch({ executablePath: 'google-chrome-unstable', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const files = glob.sync(`${inputPath}/${pattern}`)
    .map((file) => path.relative(inputPath, file));

  await Promise.all(files.map(async file => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080})
    await page.goto(`http://localhost:${port}/${file}`, { waitUntil: 'networkidle0', timeout: 20 * 1000 });
    const filePath = `${outputPath}/${file}-desktop.jpg`;
    const dir = path.dirname(filePath);
    ensureFolderExistsSync(dir);
    await page.screenshot({ path: filePath, fullPage: true });
  }))
  
  await Promise.all(files.map(async file => {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812})
    await page.goto(`http://localhost:${port}/${file}`, { waitUntil: 'networkidle0', timeout: 20 * 1000 });
    const filePath = `${outputPath}/${file}-mobile.jpg`;
    const dir = path.dirname(filePath);
    ensureFolderExistsSync(dir);
    await page.screenshot({ path: filePath, fullPage: true });
  }))

  await browser.close();
  await new Promise((resolve, reject) => server.close(resolve));
  return files.length;
}

module.exports = { createDiffScreenshots };
