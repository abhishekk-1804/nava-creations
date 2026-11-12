import { describe, it, expect, beforeEach } from 'vitest';
import { MockImageStorageAdapter } from '../src/catalog/image-storage.js';

describe('ImageStorageService (Mock Adapter)', () => {
  let adapter: MockImageStorageAdapter;

  beforeEach(() => {
    adapter = new MockImageStorageAdapter();
  });

  it('uploads valid image and stores metadata reference without keeping raw binaries in DB', async () => {
    const dummyBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header bytes
    const result = await adapter.uploadImage({
      buffer: dummyBuffer,
      filename: 'kundan-bridal-bangle-hero.png',
      mimeType: 'image/png',
      altText: 'Kundan Bridal Bangle Set in Traditional Gold Finish',
    });

    expect(result.url).toContain('https://res.cloudinary.com/');
    expect(result.publicId).toContain('catalog/products/');
    expect(result.format).toBe('png');
    expect(result.bytes).toBe(4);
    expect(adapter.hasImage(result.publicId)).toBe(true);
  });

  it('rejects unsupported image mime types', async () => {
    const dummyBuffer = new Uint8Array([0x00]);
    await expect(
      adapter.uploadImage({
        buffer: dummyBuffer,
        filename: 'malicious.exe',
        mimeType: 'application/octet-stream',
      })
    ).rejects.toThrow('Unsupported image format');
  });

  it('generates CDN transformation URLs with responsive image options', () => {
    const url = adapter.getOptimizedUrl('catalog/products/sample_123', {
      width: 800,
      height: 800,
      crop: 'fill',
      format: 'webp',
      quality: 'auto',
    });

    expect(url).toContain('w_800');
    expect(url).toContain('h_800');
    expect(url).toContain('c_fill');
    expect(url).toContain('f_webp');
    expect(url).toContain('q_auto');
  });

  it('deletes stored image references', async () => {
    const dummyBuffer = new Uint8Array([0xff, 0xd8, 0xff]);
    const uploaded = await adapter.uploadImage({
      buffer: dummyBuffer,
      filename: 'sample.jpg',
      mimeType: 'image/jpeg',
    });

    expect(adapter.hasImage(uploaded.publicId)).toBe(true);
    const deleted = await adapter.deleteImage(uploaded.publicId);
    expect(deleted).toBe(true);
    expect(adapter.hasImage(uploaded.publicId)).toBe(false);
  });
});
