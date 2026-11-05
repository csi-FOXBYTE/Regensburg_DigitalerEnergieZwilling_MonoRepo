import assert from 'node:assert/strict';
import test from 'node:test';
import { safeSubsidyHref } from '../src/lib/subsidy-href';

test('links absolute https URLs', () => {
  for (const href of [
    'https://www.kfw.de/261',
    'HTTPS://www.bafa.de/DE/Energie',
    'https://www.regensburg.de/greendeal?x=1#a',
  ]) {
    assert.equal(safeSubsidyHref(href), href);
  }
});

test('does not link other schemes, relative, malformed or missing URLs', () => {
  for (const href of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///C:/Windows/win.ini',
    'file://attacker.example/share',
    'smb://attacker.example/share',
    '\\\\attacker.example\\share',
    'http://www.kfw.de/261',
    '//attacker.example/x',
    '/de/foerderung',
    ' https://www.kfw.de/261',
    'https:\n//www.kfw.de',
    'https://',
    '',
    undefined,
    null,
    42,
  ]) {
    assert.equal(safeSubsidyHref(href), undefined, JSON.stringify(href));
  }
});
