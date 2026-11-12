import { ValidationError } from '@nava/shared';

export interface ImageUploadInput {
  buffer: Uint8Array;
  filename: string;
  mimeType: string;
  altText?: string;
}

export interface ImageUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb';
  format?: 'webp' | 'avif' | 'auto';
  quality?: number | 'auto';
}

export interface ImageStorageService {
  uploadImage(input: ImageUploadInput): Promise<ImageUploadResult>;
  deleteImage(publicId: string): Promise<boolean>;
  getOptimizedUrl(publicId: string, options?: ImageTransformOptions): string;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * In-memory test and local development adapter for product images.
 * Keeps storage provider easily replaceable without hardcoding cloud SDKs.
 */
export class MockImageStorageAdapter implements ImageStorageService {
  private readonly store = new Map<string, ImageUploadResult>();
  private readonly baseUrl = 'https://res.cloudinary.com/nava-creations-placeholder/image/upload';

  async uploadImage(input: ImageUploadInput): Promise<ImageUploadResult> {
    if (!input.filename || input.filename.trim() === '') {
      throw new ValidationError('Image filename cannot be empty');
    }

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError(
        `Unsupported image format: ${input.mimeType}. Allowed formats: JPEG, PNG, WebP, AVIF.`
      );
    }

    const publicId = `catalog/products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const format = input.mimeType.split('/')[1] || 'webp';
    const result: ImageUploadResult = {
      url: `${this.baseUrl}/${publicId}.${format}`,
      publicId,
      width: 1200,
      height: 1200,
      format,
      bytes: input.buffer.byteLength,
    };

    this.store.set(publicId, result);
    return result;
  }

  async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId) return false;
    return this.store.delete(publicId);
  }

  getOptimizedUrl(publicId: string, options?: ImageTransformOptions): string {
    const transforms: string[] = [];
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);
    if (options?.format) transforms.push(`f_${options.format}`);
    if (options?.quality) transforms.push(`q_${options.quality}`);

    const transformPath = transforms.length > 0 ? transforms.join(',') + '/' : '';
    return `${this.baseUrl}/${transformPath}${publicId}`;
  }

  hasImage(publicId: string): boolean {
    return this.store.has(publicId);
  }

  clear(): void {
    this.store.clear();
  }
}
