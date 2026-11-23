'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  unoptimized?: boolean;
}

const DEFAULT_FALLBACK = '/branding/nava-product-placeholder.jpg';

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  width,
  height,
  fill,
  priority,
  quality,
  sizes,
  unoptimized = true,
  className,
  style,
  ...rest
}: SafeImageProps) {
  const initialSrc = src && src.trim() !== '' ? src : fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextSrc = src && src.trim() !== '' ? src : fallbackSrc;
    setImgSrc(nextSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  if ((width && height) || fill) {
    return (
      <Image
        src={hasError ? fallbackSrc : imgSrc}
        alt={alt || 'NAVA Creations Atelier'}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        unoptimized={unoptimized}
        className={className}
        style={style}
        onError={handleError}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt || 'NAVA Creations Atelier'}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}

export default SafeImage;
