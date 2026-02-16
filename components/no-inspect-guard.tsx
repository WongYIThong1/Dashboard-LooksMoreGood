"use client";

import * as React from "react";

export function NoInspectGuard() {
  React.useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const preventShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;

      const blocked =
        key === "f12" ||
        (ctrlOrMeta && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (ctrlOrMeta && key === "u");

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("keydown", preventShortcuts, true);

    return () => {
      window.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("keydown", preventShortcuts, true);
    };
  }, []);

  return null;
}
