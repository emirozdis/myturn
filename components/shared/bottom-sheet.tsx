"use client";

import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { ReactNode } from "react";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  zIndex?: number;
  hasHandle?: boolean;
  showBackdrop?: boolean;
};

export function BottomSheet({
  isOpen,
  onClose,
  children,
  className = "p-6 max-h-[80%]",
  zIndex = 50,
  hasHandle = true,
  showBackdrop = true,
}: BottomSheetProps) {
  const dragControls = useDragControls();

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Dismiss the sheet if dragged down sufficiently or with high velocity
    const offsetThreshold = 80;
    const velocityThreshold = 400;
    if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              style={{ zIndex }}
            />
          )}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false} // Content scrolling is safe because drag is isolated to the handle
            dragConstraints={{ top: 0, bottom: 0 }} // Elastic bounds ensure it snaps back unless threshold is met
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-0 inset-x-0 rounded-t-[32px] flex flex-col bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${className}`}
            style={{ zIndex: zIndex + 10 }}
          >
            {hasHandle && (
              <div 
                className="w-full -mt-2 pb-5 flex justify-center cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}