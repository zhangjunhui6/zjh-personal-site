import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mediaMimeType,
  normalizeMediaItems,
  resolveMediaSrc,
} from '../src/utils/media.ts';

describe('media helpers', () => {
  it('resolves R2 object keys against a configured media base URL', () => {
    assert.equal(
      resolveMediaSrc('images/notes/demo/cover.webp', 'https://media.example.com/'),
      'https://media.example.com/images/notes/demo/cover.webp',
    );
    assert.equal(
      resolveMediaSrc('r2:/videos/projects/demo/clip.mp4', 'https://media.example.com'),
      'https://media.example.com/videos/projects/demo/clip.mp4',
    );
  });

  it('keeps relative R2 keys unchanged when no media base URL is configured', () => {
    assert.equal(resolveMediaSrc('images/notes/demo/cover.webp'), 'images/notes/demo/cover.webp');
  });

  it('keeps absolute remote URLs and local public paths unchanged', () => {
    assert.equal(resolveMediaSrc('https://cdn.example.com/a.webp', 'https://media.example.com'), 'https://cdn.example.com/a.webp');
    assert.equal(resolveMediaSrc('/images/robotics/vla/openvla-architecture.svg', 'https://media.example.com'), '/images/robotics/vla/openvla-architecture.svg');
  });

  it('normalizes structured media and legacy image paths into renderable items', () => {
    const items = normalizeMediaItems(
      [
        { type: 'video', src: 'videos/demo.mp4', title: 'Demo', poster: 'images/demo-poster.webp' },
        { type: 'image', src: ' ', alt: 'empty' },
      ],
      ['images/walk/001.webp'],
    );

    assert.deepEqual(items, [
      { type: 'video', src: 'videos/demo.mp4', title: 'Demo', poster: 'images/demo-poster.webp' },
      { type: 'image', src: 'images/walk/001.webp', alt: '' },
    ]);
  });

  it('detects common web media MIME types from paths', () => {
    assert.equal(mediaMimeType('videos/demo.mp4'), 'video/mp4');
    assert.equal(mediaMimeType('https://media.example.com/demo.webm?version=2'), 'video/webm');
    assert.equal(mediaMimeType('videos/demo.mov'), undefined);
  });
});
