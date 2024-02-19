import React, { useEffect, useRef } from "react";
import { DraggingParameters, useModelStore } from "../../model/Model";


const usePreviousEffect = (fn : any, inputs : any[] = []) => {
  const previousInputsRef = useRef([...inputs])

  useEffect(() => {
    const res = fn(previousInputsRef.current)
    previousInputsRef.current = [...inputs]
    return res;
  }, inputs)
}

export default function DragnDrop() {
  const dragging = useModelStore((state) => state.dragging);
  const draggingParameters = useModelStore((state) => state.draggingParameters);
  const stopDragging = useModelStore((state) => state.stopDragging);

  const getDraggedElement = (draggingParameters : DraggingParameters, createIfNotExist = true) => {
    let element = document.getElementById(draggingParameters.elementId);

    if (draggingParameters.cloned) {
      let clonedElement = document.getElementById(draggingParameters.elementId + '-clone') as HTMLElement;
      if (!clonedElement && element && createIfNotExist) {
        // if the cloned element is part of an svg, we need to recreate an svg for it to work
        const svg = element?.closest('svg');
        if (svg) {
          const elementRect = element.getBoundingClientRect();
          const svgRect = svg.getBoundingClientRect();
          const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgContainer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          svgContainer.setAttribute('viewBox', `${elementRect.x - svgRect.x} ${elementRect.y - svgRect.y} ${elementRect.width} ${elementRect.height}`);
          svgContainer.setAttribute('width', elementRect.width + '');
          svgContainer.setAttribute('height', elementRect.height + '');
          svgContainer.appendChild(element?.cloneNode(true) as HTMLElement);

          // Put the svg into a div
          clonedElement = document.createElement('div');
          clonedElement.appendChild(svgContainer);
        } else {
          clonedElement = element?.cloneNode(true) as HTMLElement;
        }

        clonedElement?.setAttribute('id', draggingParameters.elementId + '-clone');

        //originalElement?.parentElement?.appendChild(clonedElement);
        document.body.appendChild(clonedElement);
      }
      element = clonedElement;
    } else {
      // Maintain the original element's height
      if (element?.parentElement?.style) {
        if (element.parentElement.style.height === '') {
          element.parentElement.style.height = element?.parentElement.getBoundingClientRect().height + 'px';
        }
      }
    }

    return element;
  }

  const setElementPos = (draggingParameters : DraggingParameters, x: number, y: number, reset: boolean) => {
    const element = getDraggedElement(draggingParameters, !reset);

    if (element) {
      if (reset) {
        if (!draggingParameters.cloned) {
          if (element?.parentElement?.style) element.parentElement.style.height = ''
        } else {
          // Element is a clone and needs to be removed
          element.parentElement?.removeChild(element);
        }
      }
      
      element.style.zIndex = reset ? '' : '1000';
      element.style.pointerEvents =  reset ? '' : 'none';
      element.style.opacity =  reset ? '' : '0.8';
      element.style.position =  reset ? '' : 'absolute';
      element.style.left =  reset ? '' : x + 'px';
      element.style.top =  reset ? '' : y + 'px';

    }
  }


  usePreviousEffect(([prevDragging, prevDraggingParameters] : any) => {
    // Turn array into dictionary with elementId as key
    const prevDraggingParametersDict : {[key: string]: DraggingParameters} = {};
    prevDraggingParameters.forEach((p : DraggingParameters) => prevDraggingParametersDict[p.elementId] = p);

    const draggingParametersDict : {[key: string]: DraggingParameters} = {};
    draggingParameters.forEach((p : DraggingParameters) => draggingParametersDict[p.elementId] = p);



    if (prevDragging) {
      // For all the elements that were already there, we offset might have changed
      // Make a smooth animation to show it
      for (const elementId in draggingParametersDict) {
        if (prevDraggingParametersDict[elementId]) {
          const element = getDraggedElement(draggingParametersDict[elementId], false);
          const deltaX = draggingParametersDict[elementId].offsetX - prevDraggingParametersDict[elementId].offsetX;
          const deltaY = draggingParametersDict[elementId].offsetY - prevDraggingParametersDict[elementId].offsetY;
          if (element) {
            element.animate([
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' },
              ],
              {duration: 400, easing: 'ease-in-out'});
          }
        }
      }
    }


    const onMouseUp = (e: MouseEvent) => {
      if (dragging) {
        for (const draggingParameter of draggingParameters) {
          setElementPos(draggingParameter, e.clientX - draggingParameter.offsetX, e.clientY - draggingParameter.offsetY, true);
        }
        stopDragging();
  
        // Animate element so that it goes back to where it comes from
        /*const element = getDraggedElement();
        if (element) {
          element.animate([
            { transform: 'translate(0, 0)' },
            { transform: 'translate(-200px, 0)' },
            ],
            {duration: 200});
          }*/
        //const element = document.getElementById(draggingParameters.elementId);
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (dragging) {
        if (e.buttons === 0 && (e as any)['mozInputSource'] === undefined) {
          // Weird, should not happen. Let's force a call to onMouseUp
          onMouseUp(e);
        } else {
          for (const draggingParameter of draggingParameters) setElementPos(draggingParameter, e.clientX - draggingParameter.offsetX, e.clientY - draggingParameter.offsetY, false);
        }
      }
    }


    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("dragover", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("dragend", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("dragover", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("dragend", onMouseUp);
    }
  }, [dragging, draggingParameters]);

  return (<></>);
}

