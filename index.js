const puppeteer = require('puppeteer');
const core = require('@actions/core');
const github = require('@actions/github');
const express = require('express');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const oldPath = `${__dirname}/example/old-path/`; // core.getInput('old-path');
const newPath = `${__dirname}/example/new-path/`; //core.getInput('new-path');
const tempPath = `${__dirname}/example/temp-path/`; //core.getInput('temp-path');
const outputPath = `${__dirname}/example/output-path/`; //core.getInput('output-path');
const port = 8000;

runServer(oldPath, newPath, port);

(async () => {
  try {
    await Promise.all([
      captureScreenshots(`http://localhost:${port}/new/`, newPath, tempPath + '/new'),
      captureScreenshots(`http://localhost:${port}/old/`, oldPath, tempPath + '/old'),
    ]);
    console.log(`Old page screenshots are created in ${tempPath}/old`);
    console.log(`New page screenshots are created in ${tempPath}/new`);

    await copyDiffFiles(`${tempPath}/old`, `${tempPath}/new`, outputPath);
    console.log(`Different screenshots are copied to ${outputPath}`);
  } catch (error) {
    core.setFailed(error.message);
  }
  process.exit();
})();

async function runServer(oldPath, newPath, port) {
  try {
    const server = express();
    server.use('/old', express.static(oldPath));
    server.use('/new', express.static(newPath));
    server.listen(port, function () {
      console.log('Server listening on port ' + port);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
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

async function copyDiffFiles(left, right, output) {
  if (!fs.existsSync(output)){
    fs.mkdirSync(output, { recursive: true });
  }

  const { exec } = require("child_process");
  await new Promise((resolve, reject) => {
    exec(`diff ${left} ${right} --unidirectional-new-file --brief -r | grep '^Files '`, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      }
      resolve(stdout.split("\n"));
    });
  }).then((lines) => {
    for (const line of lines) {
      const matched = line.match(new RegExp(`${right}/[^ ]*`));
      console.log(matched)
      if (matched && matched[0]) {
        const filePath = matched[0];
        const copyPath = output + '/' + path.relative(right, filePath);
        const dir = path.dirname(copyPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        console.log(copyPath)
        fs.copyFile(filePath, copyPath, (err) => {
          console.log(err);
          if (err) {
            throw err;
          }
        });
      }
    }
  });
}