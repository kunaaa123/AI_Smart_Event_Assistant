import { createElement, useCallback, useMemo, useRef, useState } from "react";
import GlassConfirm from "../GlassConfirm";

const DEFAULT_OPTS = {
  title: "ยืนยันการทำรายการ",
  message: "คุณแน่ใจหรือไม่?",
  type: "warning", // success | info | warning | danger
  confirmText: "ยืนยัน",
  cancelText: "ยกเลิก",
  closeOnOverlay: true,
};

export default function useGlassConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState(DEFAULT_OPTS);
  const resolverRef = useRef(null);

  const close = useCallback(
    (result) => {
      setOpen(false);
      if (resolverRef.current) {
        resolverRef.current(result);
        resolverRef.current = null;
      }
    },
    [setOpen]
  );

  const handleConfirm = useCallback(() => close(true), [close]);
  const handleCancel = useCallback(() => close(false), [close]);

  const confirm = useCallback(
    (options = {}) => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setOpts({ ...DEFAULT_OPTS, ...options });
        setOpen(true);
      });
    },
    [setOpen]
  );

  const ConfirmUI = useMemo(() => {
    return createElement(GlassConfirm, {
      open,
      title: opts.title,
      message: opts.message,
      type: opts.type,
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      closeOnOverlay: opts.closeOnOverlay,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    });
  }, [open, opts, handleConfirm, handleCancel]);

  return [ConfirmUI, confirm];
}