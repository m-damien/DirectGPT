import React, { useEffect, useRef, useState } from "react";
import { useModelStore } from "../../model/Model";



export default function CustomCursor() {
  const customCursorRef = useRef<HTMLDivElement>(null);
  const selectedTool = useModelStore((state) => state.selectedTool);
  const [offset, setOffset] = useState({x: 10, y: 5});
  const [isVisible, setIsVisible] = useState(false);
  const type = useModelStore((state) => state.type);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (customCursorRef.current) {
        // hide the cursor if it is not hover an element that has "object-of-interest" as an ancestor
        const visible = e.target instanceof Element && e.target.closest('#object-of-interest') !== null;
        if (isVisible !== visible) setIsVisible(visible);

        customCursorRef.current.style.left = e.pageX + offset.x + "px";
        customCursorRef.current.style.top = e.pageY + offset.y + "px";
      }
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [isVisible]);

  return (<div style={{position: 'absolute', textAlign: 'left', display: isVisible ? "block" : "none",
       pointerEvents: 'none', fontSize: 8, zIndex: 9999, 
       color: type === "code" ? 'rgba(200, 200, 200, 0.9)' : 'rgba(0, 0, 0, 0.8)', 
       maxWidth: 50}} ref={customCursorRef}>
    {selectedTool}
    </div>);
}

