const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");

async function copyDiffFiles(left, right, output) {
  ensureFolderExistsSync(left);
  ensureFolderExistsSync(right);
  ensureFolderExistsSync(output);

  const lines = await new Promise((resolve, reject) => {
    exec(`diff ${left} ${right} --unidirectional-new-file --brief -r | grep '^Files '`, (error, stdout, stderr) => {
      if (stderr) {
        reject(new Error(stderr));
      }
      resolve(stdout.split("\n"));
    });
  });

  var count = 0;
  for (const line of lines) {
    const matched = line.match(new RegExp(`${right}/[^ ]*`));
    if (matched && matched[0]) {
      ++ count;

      const filePath = matched[0];
      const copyPath = output + '/' + path.relative(right, filePath);
      const dir = path.dirname(copyPath);
      ensureFolderExistsSync(dir);
      fs.copyFile(filePath, copyPath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }

  return count;
}

function ensureFolderExistsSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = { copyDiffFiles, ensureFolderExistsSync };