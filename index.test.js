const path = require('path');
const fs = require('fs-extra');
const { createDiffScreenshots } = require('./src/pgdiff');
const { runServer } = require('./src/server');
var server = null;

beforeAll(() => {
  server = runServer('example/old-path', 'example/new-path', 8000);
});

afterAll((done) => {
  server.close(done);
})

test('Create differnt files', async () => {
  fs.removeSync('tmp'); 

  await createDiffScreenshots(
    path.resolve(__dirname, 'example/old-path'),
    path.resolve(__dirname, 'example/new-path'),
    path.resolve(__dirname, 'tmp/tmp'),
    path.resolve(__dirname, 'tmp/output'),
    8000);

  expect(fs.existsSync('tmp/output/new.html.jpg')).toBeTruthy();
  expect(fs.existsSync('tmp/output/index.html.jpg')).toBeTruthy();
  expect(fs.existsSync('tmp/output/folder/nested.htm.jpg')).toBeTruthy();

  expect(fs.existsSync('tmp/output/identical.html.jpg')).toBeFalsy();
  expect(fs.existsSync('tmp/output/removed.html.jpg')).toBeFalsy();
});