const path = require('path');
const fs = require('fs-extra');
const { createDiffScreenshots } = require('./src/pgdiff');
const { runServer } = require('./src/server');
var server = null;

beforeAll((done) => {
  server = runServer('example/base', 'example/head', 8000, done);
});

afterAll((done) => {
  server.close(done);
})

test('Create differnt files', async () => {
  fs.removeSync('tmp'); 

  await createDiffScreenshots('example/base', 'example/head', 'tmp/tmp', 'tmp/output', 8000);

  expect(fs.existsSync('tmp/output/new.html.jpg')).toBeTruthy();
  expect(fs.existsSync('tmp/output/index.html.jpg')).toBeTruthy();
  expect(fs.existsSync('tmp/output/folder/nested.htm.jpg')).toBeTruthy();

  expect(fs.existsSync('tmp/output/identical.html.jpg')).toBeFalsy();
  expect(fs.existsSync('tmp/output/removed.html.jpg')).toBeFalsy();
});
