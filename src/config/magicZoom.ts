/**
 * Magic Zoom Plus configuration.
 * Full option reference: https://www.magictoolbox.com/magiczoomplus/docs/
 */

export type MagicZoomOptions = {
  /** Trigger that activates the zoom. */
  zoomOn?: "hover" | "click";

  /** Zoom rendering mode. `false` disables zoom entirely. */
  zoomMode?: "zoom" | "magnifier" | "preview" | "off" | false;

  /** Width of the zoom window. Number (px) or "auto". */
  zoomWidth?: number | "auto";

  /** Height of the zoom window. Number (px) or "auto". */
  zoomHeight?: number | "auto";

  /** Position of the zoom window relative to the main image. */
  zoomPosition?: "top" | "right" | "bottom" | "left" | "inner" | `#${string}`;

  /** Gap (px) between the main image and zoom window. */
  zoomDistance?: number;

  /** Where to show the image caption inside the zoom window. */
  zoomCaption?: "top" | "bottom" | "off" | false;

  /** Expand (lightbox) behaviour. `false` disables expand. */
  expand?: "window" | "fullscreen" | "off" | false;

  /** Zoom mode used inside the expanded view. */
  expandZoomMode?: "zoom" | "magnifier" | "off" | false;

  /** What triggers zoom inside the expanded view. */
  expandZoomOn?: "click" | "always";

  /** Show caption in expanded view. */
  expandCaption?: boolean;

  /** Close expanded view when clicking outside the image. */
  closeOnClickOutside?: boolean;

  /** Show the zoom hint message. */
  hint?: boolean;

  /** Enable smooth panning inside the zoom window. */
  smoothing?: boolean;

  /** Allow mouse-wheel zoom level changes. */
  variableZoom?: boolean;

  /** Delay loading the large image until zoom activates. */
  lazyZoom?: boolean;

  /** Auto-start zoom on page load. */
  autostart?: boolean;

  /** Allow right-click context menu on the image. */
  rightClick?: boolean;

  /** Animate transitions between selector images. */
  transitionEffect?: boolean;

  /** Trigger for thumbnail/selector images. */
  selectorTrigger?: "hover" | "click";

  /** Extra CSS class(es) applied to the zoom container. */
  cssClass?: string;

  /** Treat mouse as touch on desktop (for testing). */
  forceTouch?: boolean;

  /** Push expand state to browser history (back-button closes). */
  history?: boolean;

  /** Upscale small images to fill the zoom window. */
  upscale?: boolean;

  /** Hint text shown for click-to-zoom mode. */
  textClickZoomHint?: string;

  /** Hint text shown for hover-to-zoom mode. */
  textHoverZoomHint?: string;

  /** Hint text shown for click-to-expand. */
  textExpandHint?: string;

  /** Accessible label for the close button. */
  textBtnClose?: string;

  /** Accessible label for the previous button. */
  textBtnPrev?: string;

  /** Accessible label for the next button. */
  textBtnNext?: string;
};

/**
 * Serialize a config object into the semicolon-delimited string
 * that Magic Zoom Plus expects in the `data-options` attribute.
 *
 * Example output: "zoomOn: hover; hint: off; expand: window;"
 */
export function serializeOptions(opts: MagicZoomOptions): string {
  return Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => {
      const k = key.replace(/[A-Z]/g, (ch) => "-" + ch.toLowerCase());
      if (typeof value === "boolean") return `${k}: ${value ? "on" : "off"}`;
      return `${k}: ${value}`;
    })
    .join("; ");
}

// ---------------------------------------------------------------------------
// Default presets — adjust these to match your store's UX requirements.
// ---------------------------------------------------------------------------

/** Options applied to the main PDP zoom image. */
export const pdpZoomOptions: MagicZoomOptions = {
  zoomOn: "hover",
  zoomMode: "zoom",
  zoomPosition: "right",
  zoomDistance: 15,
  zoomCaption: "off",
  expand: "window",
  expandZoomOn: "click",
  expandCaption: true,
  closeOnClickOutside: true,
  hint: false,
  smoothing: true,
  lazyZoom: true,
  transitionEffect: true,
  selectorTrigger: "click",
  rightClick: false,
  textClickZoomHint: "",
  textHoverZoomHint: "",
  textExpandHint: "",
};

/** Pre-serialized string ready for `data-options`. */
export const pdpZoomOptionsString = serializeOptions(pdpZoomOptions);
