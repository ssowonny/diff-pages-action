const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");

async function copyDiffFiles(left, right, output) {
  if (!fs.existsSync(output)){
    fs.mkdirSync(output, { recursive: true });
  }

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
      if (matched && matched[0]) {
        const filePath = matched[0];
        const copyPath = output + '/' + path.relative(right, filePath);
        const dir = path.dirname(copyPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFile(filePath, copyPath, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    }
  });
}

module.exports = { copyDiffFiles };