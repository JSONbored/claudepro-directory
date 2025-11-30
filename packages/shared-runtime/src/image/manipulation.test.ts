import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ensureImageMagickInitialized,
  processImage,
  optimizeImage,
  resizeImage,
  getImageDimensions,
  convertImageFormat,
  type ImageProcessOptions,
} from './manipulation';

// Mock Deno global
const mockDenoReadFile = vi.fn();
(globalThis as any).Deno = {
  readFile: mockDenoReadFile,
};

// Mock ImageMagick
const mockImgResize = vi.fn();
const mockImgBlur = vi.fn();
const mockImgWrite = vi.fn((callback: (data: Uint8Array) => Uint8Array) => {
  return callback(new Uint8Array([1, 2, 3, 4]));
});

const mockImageMagick = {
  read: vi.fn((imageData: Uint8Array, callback: Function) => {
    const mockImg = {
      width: 800,
      height: 600,
      resize: mockImgResize,
      blur: mockImgBlur,
      write: mockImgWrite,
    };
    return callback(mockImg);
  }),
};

const mockInitializeImageMagick = vi.fn();

vi.mock('@imagemagick/magick-wasm', () => ({
  ImageMagick: mockImageMagick,
  initializeImageMagick: mockInitializeImageMagick,
  MagickFormat: {
    Png: 'png',
    Jpeg: 'jpeg',
    Webp: 'webp',
  },
}));

describe('ensureImageMagickInitialized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset initialization state
    (ensureImageMagickInitialized as any).initialized = false;
    (ensureImageMagickInitialized as any).initError = null;
  });

  it('should initialize ImageMagick successfully', async () => {
    const wasmBytes = new Uint8Array([0, 1, 2, 3]);
    mockDenoReadFile.mockResolvedValueOnce(wasmBytes);
    mockInitializeImageMagick.mockResolvedValueOnce(undefined);

    await ensureImageMagickInitialized();

    expect(mockDenoReadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining('magick.wasm'),
      })
    );
    expect(mockInitializeImageMagick).toHaveBeenCalledWith(wasmBytes);
  });

  it('should only initialize once (idempotent)', async () => {
    const wasmBytes = new Uint8Array([0, 1, 2, 3]);
    mockDenoReadFile.mockResolvedValue(wasmBytes);
    mockInitializeImageMagick.mockResolvedValue(undefined);

    await ensureImageMagickInitialized();
    await ensureImageMagickInitialized();
    await ensureImageMagickInitialized();

    expect(mockDenoReadFile).toHaveBeenCalledTimes(1);
    expect(mockInitializeImageMagick).toHaveBeenCalledTimes(1);
  });

  it('should throw error on initialization failure', async () => {
    mockDenoReadFile.mockRejectedValueOnce(new Error('Failed to read WASM'));

    await expect(ensureImageMagickInitialized()).rejects.toThrow(
      'Failed to initialize ImageMagick'
    );
  });

  it('should cache and re-throw initialization error', async () => {
    mockDenoReadFile.mockRejectedValue(new Error('Failed to read WASM'));

    await expect(ensureImageMagickInitialized()).rejects.toThrow();
    await expect(ensureImageMagickInitialized()).rejects.toThrow();

    expect(mockDenoReadFile).toHaveBeenCalledTimes(1);
  });
});

describe('processImage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockImgResize.mockClear();
    mockImgBlur.mockClear();
    
    // Mock successful initialization
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    // Reset initialization state
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should process image without any options', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await processImage(imageData);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(mockImageMagick.read).toHaveBeenCalledWith(imageData, expect.any(Function));
  });

  it('should resize image with width and height', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      resize: { width: 400, height: 300 },
    };

    await processImage(imageData, options);

    expect(mockImgResize).toHaveBeenCalledWith(400, 300);
  });

  it('should resize image with width only (maintain aspect ratio)', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      resize: { width: 400 },
    };

    await processImage(imageData, options);

    expect(mockImgResize).toHaveBeenCalledWith(400, 0);
  });

  it('should resize image with height only (maintain aspect ratio)', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      resize: { height: 300 },
    };

    await processImage(imageData, options);

    expect(mockImgResize).toHaveBeenCalledWith(0, 300);
  });

  it('should apply blur effect', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      blur: { radius: 5, sigma: 2 },
    };

    await processImage(imageData, options);

    expect(mockImgBlur).toHaveBeenCalledWith(5, 2);
  });

  it('should apply multiple transformations', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      resize: { width: 400, height: 300 },
      blur: { radius: 3, sigma: 1.5 },
    };

    await processImage(imageData, options);

    expect(mockImgResize).toHaveBeenCalledWith(400, 300);
    expect(mockImgBlur).toHaveBeenCalledWith(3, 1.5);
  });
});

describe('optimizeImage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockImgResize.mockClear();
    
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should optimize image with max dimension', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    await optimizeImage(imageData, 500);

    expect(mockImgResize).toHaveBeenCalledWith(500, 500);
  });

  it('should accept custom format', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await optimizeImage(imageData, 500, 'jpeg' as any);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should accept custom quality', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await optimizeImage(imageData, 500, 'png' as any, 90);

    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('resizeImage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockImgResize.mockClear();
    
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should resize to specific dimensions', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    await resizeImage(imageData, 640, 480);

    expect(mockImgResize).toHaveBeenCalledWith(640, 480);
  });

  it('should accept format parameter', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await resizeImage(imageData, 640, 480, 'webp' as any);

    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('getImageDimensions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should return image dimensions', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const dimensions = await getImageDimensions(imageData);

    expect(dimensions).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('should throw error if dimensions cannot be read', async () => {
    // Mock ImageMagick.read to not call the callback
    mockImageMagick.read.mockImplementationOnce((imageData: Uint8Array, callback: Function) => {
      // Don't call callback
      return new Uint8Array(0);
    });

    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    await expect(getImageDimensions(imageData)).rejects.toThrow('Failed to read image dimensions');
  });
});

describe('convertImageFormat', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should convert image to target format', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await convertImageFormat(imageData, 'webp' as any);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should accept quality parameter', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await convertImageFormat(imageData, 'jpeg' as any, 75);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should default to 85 quality', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    
    const result = await convertImageFormat(imageData, 'jpeg' as any);

    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('edge cases', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    mockDenoReadFile.mockResolvedValue(new Uint8Array([0, 1, 2, 3]));
    mockInitializeImageMagick.mockResolvedValue(undefined);
    
    (ensureImageMagickInitialized as any).initialized = false;
    await ensureImageMagickInitialized();
  });

  it('should handle empty image data', async () => {
    const imageData = new Uint8Array([]);
    
    const result = await processImage(imageData);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('should handle resize with zero dimensions', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      resize: { width: 0, height: 0 },
    };

    await processImage(imageData, options);

    // Should not call resize when both are 0
    expect(mockImgResize).not.toHaveBeenCalled();
  });

  it('should handle blur with zero parameters', async () => {
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const options: ImageProcessOptions = {
      blur: { radius: 0, sigma: 0 },
    };

    await processImage(imageData, options);

    expect(mockImgBlur).toHaveBeenCalledWith(0, 0);
  });
});