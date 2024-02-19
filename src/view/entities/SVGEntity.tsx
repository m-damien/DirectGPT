import React, { useEffect, useRef, useState } from "react";
import { EntityElement, SVGData } from "../../model/Element";
import { DraggingParameters, useModelStore } from '../../model/Model';



export default function SVGEntity() {
  const gptMessages = useModelStore((state) => state.gptMessages);
  const getLastGptMessage = useModelStore((state) => state.getLastGptMessage);
  const setLastGptMessage = useModelStore((state) => state.setLastGptMessage);

  const [selectionRectX, setSelectionRectX] = useState(0);
  const [selectionRectY, setSelectionRectY] = useState(0);
  const [selectionRectWidth, setSelectionRectWidth] = useState(0);
  const [selectionRectHeight, setSelectionRectHeight] = useState(0);
  const selectedElements = useModelStore((state) => state.selectedElements);
  const setSelectedElements = useModelStore((state) => state.setSelectedElements);
  const loadingElements = useModelStore((state) => state.loadingElements);
  const inMultipleSelectionMode = useModelStore((state) => state.inMultipleSelectionMode);
  const hoveredElements = useModelStore((state) => state.hoveredElements);

  const startDragging = useModelStore((state) => state.startDragging);

  const svgDivRef = useRef<HTMLDivElement>(null);


  function mousePosToSVGPos(x: number, y: number) {
    const svgElement = (svgDivRef.current?.firstChild as SVGGraphicsElement)
    // Convert mouse coordinate to svg coordinate using DOMPoint
    const pt = new DOMPoint(x, y);
    let resPt =  pt.matrixTransform(svgElement.getScreenCTM()?.inverse());
    // round to only 1 decimal
    resPt.x = Math.round(resPt.x * 10) / 10;
    resPt.y = Math.round(resPt.y * 10) / 10;
    return resPt;
  }

  function getEntityElementFromSVGElement(svgElement: Element): EntityElement {
    const elementRect = svgElement.getBoundingClientRect();
    const svgRect = svgDivRef.current?.getBoundingClientRect() || elementRect;

    const elementPrompt = `element with id "${svgElement.id}"`;

    const htmlRepresentation = <svg
      style={{ pointerEvents: 'none', display: 'inline-block' }}
      width={30} height={15}
      viewBox={`${elementRect.x - svgRect.x} ${elementRect.y - svgRect.y} ${elementRect.width} ${elementRect.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio='xMidYMid meet'
      dangerouslySetInnerHTML={{ __html: svgElement.outerHTML as any }} />;

    return {
      x: elementRect.x, y: elementRect.y, width: elementRect.width, height: elementRect.height,
      htmlRepresentation: htmlRepresentation,
      textRepresentation: elementPrompt,
      customData: { id: svgElement.id }
    };
  }

  function getEntityElementFromLocation(x: number, y: number): EntityElement {
    const svgPos = mousePosToSVGPos(x, y);
    let rect: any = { x: 0, y: 0, width: 0, height: 0 };
    const elementPrompt = `location ${svgPos.x} ${svgPos.y}`;

    return {
      customData: { id: `location ${svgPos.x} ${svgPos.y}` },
      htmlRepresentation: <>{`(${Math.round(svgPos.x)}, ${Math.round(svgPos.y)})`}</>,
      textRepresentation: elementPrompt,
      x: x - 1, y: y - 1, width: 3, height: 3
    };
  }


  useEffect(() => {
    if (svgDivRef.current) {
      const svg = svgDivRef.current.firstChild as SVGElement;
      let needToUpdateSvgCode = false;

      if (svg && svg.children) {
        // Loop through all the child and make them draggable
        for (let i = 0; i < svg.children.length; i++) {
          const child = svg.children[i] as SVGElement;

          // Give the child an id
          const cid = `${child.tagName[0]}${i}`;
          if (!child.id || child.id !== cid) {
            // Only update svg code if ids are missing
            needToUpdateSvgCode = true;
          }

          child.id = cid;

          // Show the elements that are currently loading because a prompt has been dropped on them
          if (loadingElements.map(e => (e.customData as SVGData).id).includes(child.id)) {
            if (!child.classList.contains("loading")) child.classList.add("loading");
          } else {
            child.classList.remove("loading");
          }
        }

        if (needToUpdateSvgCode) {
          setLastGptMessage(svg.outerHTML);
        }
      }
    }
  }, [gptMessages, loadingElements]);

  const emptyDivRef = useRef<HTMLDivElement>(null);


  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} draggable
      onDragStart={(e) => {
        e.preventDefault();
        if (selectedElements.length > 0) {
          //setSelectedElements([]);
          const draggingParams : DraggingParameters[] = [];

          for (const selectedElement of selectedElements) {
            const id = (selectedElement.customData as SVGData).id;

            const htmlElement = document.getElementById(id) || document.getElementById("selectionRect");
            if (htmlElement) {
              const offsetX = e.clientX - htmlElement.getBoundingClientRect().x;
              const offsetY = e.clientY - htmlElement.getBoundingClientRect().y;
              draggingParams.push({ initialX: e.clientX, initialY: e.clientY, entities: [selectedElement], offsetX: offsetX, offsetY: offsetY, cloned: true, elementId: htmlElement.id });
            }
          }
          if (draggingParams.length > 0) startDragging(draggingParams);
        }
      }}
    >
      <div ref={emptyDivRef}><span style={{ position: 'absolute', pointerEvents: 'none', color: 'rgba(0, 0, 0, 0)' }}>.</span></div>
      <div
        id="svgEntityDiv"
        onMouseMove={(e) => {
          const target = e.target as Element;
          const selectionRect = document.getElementById("selectionRect");

          // Target should not be a div
          if (target && selectionRect && target.tagName !== 'DIV') {
            let rect = { x: 0, y: 0, width: 0, height: 0 };

            if (target.tagName === 'svg') {
              rect = { x: e.clientX, y: e.clientY, width: 3, height: 3 };
            } else if (target.id) {
              rect = target.getBoundingClientRect();
            }

            if (rect.width !== 0) {
              selectionRect.style.left = `${rect.x - 2}px`;
              selectionRect.style.top = `${rect.y - 2}px`;
              selectionRect.style.width = `${rect.width}px`;
              selectionRect.style.height = `${rect.height}px`;
              selectionRect.style.display = 'block';
            }
          }
        }}

        onMouseDown={(e) => {
          const target = e.target as Element;
          if (target) {
            let elements = e.metaKey || e.shiftKey || e.ctrlKey || inMultipleSelectionMode ? selectedElements : [] as EntityElement[];
            if (target.tagName === 'svg') {
              // This targetting a pixel
              setSelectedElements([...elements,
              getEntityElementFromLocation(e.clientX, e.clientY)
              ]);
            } else if (target.id) {
              // This is targetting an element
              setSelectedElements([...elements,
              getEntityElementFromSVGElement(target)
              ]);
            }
          }
        }}

        style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px', marginLeft: 20, marginRight: 20, marginTop: 20, width: 'max-content', height: 'max-content' }}

        onMouseLeave={(e) => {
          setSelectionRectX(-1);
          setSelectionRectY(-1);
          setSelectionRectWidth(-1);
          setSelectionRectHeight(-1);
          const selectionRect = document.getElementById("selectionRect");
          if (selectionRect) {
            selectionRect.style.display = 'none';
          }
        }}

        onMouseUp={(e) => {
          // Output-Output interaction
          // Disabled for now
          /*
          if (dragging) {
            const finalX = e.clientX;
            const finalY = e.clientY;
            const initialX = draggingParameters.initialX;
            const initialY = draggingParameters.initialY;
            const translateX = finalX - initialX;
            const translateY = finalY - initialY;

            // Craft a prompt to do the translation
            const svgDiv = document.getElementById("svgEntityDiv");
            if (svgDiv) {
              const svgElement = (svgDiv.firstChild as SVGGraphicsElement)
              const svgCode = svgElement.outerHTML;
              const prompt = new SVGPrompt(svgCode, draggingParameters.entities, [{ type: 'text', text: `add translate of ${translateX} ${translateY}` }], false);
              setLoadingElements(draggingParameters.entities);
              executePrompt(prompt, () => {
                setSelectedElements([]);
                setLoadingElements([]);
              });
            }
          }*/
        }}


        ref={svgDivRef}
        dangerouslySetInnerHTML={{ __html: getLastGptMessage().content }}></div>
      {loadingElements.map((e, i) => {
        // if e.customData is of type number, then we return null
        if (typeof e.customData === 'number') return null;
        return <div key={i} className='loading' style={{ position: 'absolute', pointerEvents: 'none', display: 'block', left: e.x - 1, top: e.y - 1, width: e.width, height: e.height, border: '2px solid blue' }}></div>
      })}
      <div id="selectionRect" style={{ position: 'absolute', pointerEvents: 'none', display: selectionRectWidth <= 0 ? 'none' : 'block', left: selectionRectX - 2, top: selectionRectY - 2, width: selectionRectWidth, height: selectionRectHeight, border: '2px solid blue' }}></div>
      {selectedElements.concat(hoveredElements).map((element, i) => {
        return <div key={i} style={{ position: 'absolute', pointerEvents: 'none', display: 'block', left: element.x - 2, top: element.y - 2, width: element.width, height: element.height, border: '2px dashed rgb(120, 150, 255)' }}></div>
      })}
    </div>
  );
}

