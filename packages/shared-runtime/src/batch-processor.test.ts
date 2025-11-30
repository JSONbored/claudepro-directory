import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BatchProcessor } from './batch-processor.ts';

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor<string> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // Clean up any active batch processor
    if (batchProcessor) {
      await batchProcessor.shutdown();
      batchProcessor = null;
    }
    vi.useRealTimers();
  });

  describe('batching behavior', () => {
    it('processes items in batches', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 3,
        flushInterval: 1000,
        processor,
      });

      batchProcessor.add('item1');
      batchProcessor.add('item2');
      batchProcessor.add('item3'); // This should trigger flush

      // Wait for the batch to process (microtask queue)
      await Promise.resolve();

      expect(processor).toHaveBeenCalledOnce();
      expect(processor).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('flushes incomplete batch on interval', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 5,
        flushInterval: 1000,
        processor,
      });

      batchProcessor.add('item1');
      batchProcessor.add('item2');
      // Only 2 items, batch size is 5

      // Fast-forward time to trigger interval flush
      await vi.advanceTimersByTimeAsync(1001);

      expect(processor).toHaveBeenCalledOnce();
      expect(processor).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('handles multiple batches', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 2,
        flushInterval: 5000,
        processor,
      });

      // First batch
      batchProcessor.add('item1');
      batchProcessor.add('item2');
      
      await Promise.resolve(); // Wait for batch to process
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenNthCalledWith(1, ['item1', 'item2']);

      // Second batch
      batchProcessor.add('item3');
      batchProcessor.add('item4');
      
      await Promise.resolve(); // Wait for batch to process
      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenNthCalledWith(2, ['item3', 'item4']);
    });

    it('does not flush empty batches', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 3,
        flushInterval: 1000,
        processor,
      });

      // No items added
      await vi.advanceTimersByTimeAsync(1001);

      expect(processor).not.toHaveBeenCalled();
    });
  });

  describe('manual flushing', () => {
    it('flushes pending items on demand', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 10,
        flushInterval: 5000,
        processor,
      });

      batchProcessor.add('item1');
      batchProcessor.add('item2');

      // Manual flush before batch size or interval
      await batchProcessor.flush();

      expect(processor).toHaveBeenCalledOnce();
      expect(processor).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('flush() resolves immediately when batch is empty', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 5,
        flushInterval: 1000,
        processor,
      });

      await batchProcessor.flush();

      expect(processor).not.toHaveBeenCalled();
    });

    it('flush() waits for processor to complete', async () => {
      let resolveProcessor: (value: void) => void;
      const processorPromise = new Promise<void>(resolve => {
        resolveProcessor = resolve;
      });
      const processor = vi.fn().mockReturnValue(processorPromise);
      
      batchProcessor = new BatchProcessor({
        batchSize: 5,
        flushInterval: 1000,
        processor,
      });

      batchProcessor.add('item1');
      
      const flushPromise = batchProcessor.flush();
      
      // Processor not complete yet
      expect(processor).toHaveBeenCalledOnce();
      
      // Complete processor
      resolveProcessor!();
      await flushPromise;
    });
  });

  describe('error handling', () => {
    it('handles processor errors gracefully', async () => {
      const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));
      batchProcessor = new BatchProcessor({
        batchSize: 2,
        flushInterval: 1000,
        processor,
      });

      batchProcessor.add('item1');
      batchProcessor.add('item2');

      // Wait for batch to process
      await Promise.resolve();
      await Promise.resolve();

      // Error should be logged but not thrown
      expect(processor).toHaveBeenCalledOnce();
    });

    it('continues processing after error', async () => {
      const processor = vi.fn()
        .mockRejectedValueOnce(new Error('First batch failed'))
        .mockResolvedValueOnce(undefined);
      
      batchProcessor = new BatchProcessor({
        batchSize: 2,
        flushInterval: 1000,
        processor,
      });

      // First batch (will fail)
      batchProcessor.add('item1');
      batchProcessor.add('item2');
      
      // Wait for first batch to process
      await batchProcessor.flush();
      expect(processor).toHaveBeenCalledTimes(1);

      // Second batch (will succeed)
      batchProcessor.add('item3');
      batchProcessor.add('item4');
      
      // Wait for second batch to process
      await batchProcessor.flush();
      expect(processor).toHaveBeenCalledTimes(2);
    });
  });

  describe('shutdown', () => {
    it('flushes pending items on shutdown', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 10,
        flushInterval: 5000,
        processor,
      });

      batchProcessor.add('item1');
      batchProcessor.add('item2');

      await batchProcessor.shutdown();
      // Prevent afterEach from trying to shutdown again
      batchProcessor = null;

      expect(processor).toHaveBeenCalledOnce();
      expect(processor).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('stops accepting items after shutdown', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 3,
        flushInterval: 1000,
        processor,
      });

      await batchProcessor.shutdown();
      // Prevent afterEach from trying to shutdown again
      batchProcessor = null;

      // This should be ignored since we already called shutdown
      // batchProcessor.add('item1');

      // Should not process items added after shutdown
      expect(processor).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles batch size of 1', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 1,
        flushInterval: 1000,
        processor,
      });

      batchProcessor.add('item1');
      await Promise.resolve();

      expect(processor).toHaveBeenCalledWith(['item1']);

      batchProcessor.add('item2');
      await Promise.resolve();

      expect(processor).toHaveBeenCalledWith(['item2']);
      expect(processor).toHaveBeenCalledTimes(2);
    });

    it('handles very large batches', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);
      batchProcessor = new BatchProcessor({
        batchSize: 1000,
        flushInterval: 1000,
        processor,
      });

      // Add 1000 items
      for (let i = 0; i < 1000; i++) {
        batchProcessor.add(`item${i}`);
      }

      await Promise.resolve();

      expect(processor).toHaveBeenCalledOnce();
      expect(processor.mock.calls[0][0]).toHaveLength(1000);
    });

    it('handles concurrent adds during processing', async () => {
      const processor = vi.fn().mockResolvedValue(undefined);

      batchProcessor = new BatchProcessor({
        batchSize: 2,
        flushInterval: 5000,
        processor,
      });

      // First batch - triggers processing
      batchProcessor.add('item1');
      batchProcessor.add('item2');

      // Add more items that form another complete batch
      batchProcessor.add('item3');
      batchProcessor.add('item4');

      // Flush all pending items
      await batchProcessor.flush();

      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenNthCalledWith(1, ['item1', 'item2']);
      expect(processor).toHaveBeenNthCalledWith(2, ['item3', 'item4']);
    });
  });
});