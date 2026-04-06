"use client";

import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Renders ToastContainer with top offset from StickyHeaderHeightContext
 * so toasts appear below the sticky header. Must be used inside StickyHeaderHeightProvider.
 */
export default function ToastContainerWithOffset() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      transition={Slide}
    />
  );
}
