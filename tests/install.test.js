import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isIosDevice } from '../js/install.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

test('iPhone : appareil iOS', () => {
  assert.equal(isIosDevice(IPHONE, 5), true);
});

test('iPad récent (se présente comme un Mac tactile) : appareil iOS', () => {
  assert.equal(isIosDevice(MAC, 5), true);
});

test('Mac sans écran tactile, Android : pas iOS', () => {
  assert.equal(isIosDevice(MAC, 0), false);
  assert.equal(isIosDevice(ANDROID, 5), false);
});
