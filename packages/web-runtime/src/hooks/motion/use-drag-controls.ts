/**
 * useDragControls Hook
 * 
 * Creates drag controls that can be used to manually start dragging from any pointer event.
 * Useful for drag handles, video scrubbers, and custom drag triggers.
 * 
 * @module web-runtime/hooks/motion/use-drag-controls
 * 
 * @example
 * ```tsx
 * function DraggableItem() {
 *   const controls = useDragControls();
 *   
 *   return (
 *     <motion.div drag dragControls={controls} dragListener={false}>
 *       <div
 *         onPointerDown={(e) => controls.start(e)}
 *         className="drag-handle"
 *         style={{ touchAction: 'none' }}
 *       >
 *         ⋮⋮
 *       </div>
 *       {/* Item content *\/}
 *     </motion.div>
 *   );
 * }
 * ```
 */

'use client';

import { useDragControls as useMotionDragControls } from 'motion/react';
import type { DragControls } from 'motion/react';

/**
 * Hook that returns drag controls for manually initiating drag gestures.
 * 
 * The controls can be passed to a draggable motion component via the `dragControls` prop.
 * To start dragging from a different element, call `controls.start(event)` in that
 * element's `onPointerDown` handler.
 * 
 * @returns Drag controls object with `start()`, `stop()`, and `cancel()` methods
 * 
 * @see https://motion.dev/docs/react/utilities/use-drag-controls
 */
export function useDragControls(): DragControls {
  return useMotionDragControls();
}
