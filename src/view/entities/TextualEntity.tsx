import * as Diff from 'diff';
import React, { useEffect, useState } from "react";
import { EntityElement, TextData } from '../../model/Element';
import { DraggingParameters, useModelStore } from '../../model/Model';
// @ts-ignore
import OverlappingMarkup from '../components/OverlappingMarkup';

function SelectedText(props: { children: JSX.Element, id: string, style? : React.CSSProperties, className? : string}) {
  const selectedElements = useModelStore((state) => state.selectedElements);
  const startDragging = useModelStore((state) => state.startDragging);
  const dragging = useModelStore((state) => state.dragging);
  const [isClicked, setIsClicked] = useState(false);

  return <span 
                className={props.className} 
                id={props.id}
                style={{borderRadius: 2, cursor: 'pointer', ...props.style}}
                
                onMouseDown={(e) => {       
                  e.preventDefault();
                  // if this a right click
                  if (e.button === 2) {
                    // set selection to this span so that the context menu shows the right text
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.target as Node);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  } else if (e.button === 0) {
                    setIsClicked(true);
                  }
                }}

                onMouseUp={(e) => {
                  if (e.button === 0) {
                    setIsClicked(false);
                  }
                }}

                onMouseMove={(e) => {
                  if (isClicked && !dragging && e.buttons === 1) {
                    // Should drag all selections
                    const draggingParameters : DraggingParameters[] = [];
                    selectedElements.forEach((element, i) => {
                      // Get the corresponding span
                      const span = document.getElementById("selection" + i);
                      if (span) {
                        const rect = span.getBoundingClientRect();
                        const offsetX = e.clientX - rect.left;
                        const offsetY = e.clientY - rect.top;
                        draggingParameters.push({elementId: span.id, initialX: e.clientX, initialY: e.clientY, cloned: true, offsetX: offsetX, offsetY: offsetY, entities: [element]});
                      }
                    });

                    if (draggingParameters.length > 0) {
                      startDragging(draggingParameters);
                    }
                  }
                }}
                >{props.children}</span>
}

export default function TextualEntity(props: { style? : React.CSSProperties, selectionPadding?: number, disableDiffMarkup?: boolean }) {
  const getLastGptMessage = useModelStore((state) => state.getLastGptMessage);
  const gptMessages = useModelStore((state) => state.gptMessages);
  const history = useModelStore((state) => state.history);
  const selectedElements = useModelStore((state) => state.selectedElements);
  const setSelectedElements = useModelStore((state) => state.setSelectedElements);
  const loadingElements = useModelStore((state) => state.loadingElements);
  const inMultipleSelectionMode = useModelStore((state) => state.inMultipleSelectionMode);
  const hoveredElements = useModelStore((state) => state.hoveredElements);

  const gptOutput = getLastGptMessage().content;

  // Create a list of annotations that will mark up the text
  const annotations : {min: number, max: number, style: any, data?: any}[] = [];

  const StyleBold = {
    content: (props : {children : JSX.Element}) => <b>{ props.children }</b>,
  };

  const StyleSelection = {
    content: (sprops : {children : JSX.Element, styleData: {element : EntityElement, index: number, isLoading: boolean}}) => {
      return <SelectedText id={"selection"+sprops.styleData.index} style={{paddingTop: props.selectionPadding || 2.5, paddingBottom: props.selectionPadding || 2.5}} className={"selectedText" + (sprops.styleData.isLoading ? " loading" : "")}>{sprops.children}</SelectedText>
    }
  }

  // Mark up selections
  selectedElements.forEach((element, i) => {
    const textData = element.customData as TextData;
    annotations.push({min: textData.startIndex, max: textData.endIndex, style: StyleSelection, data: {element: element, index: i, isLoading: false}})
  });

  // Mark up hovered elements
  hoveredElements.forEach((element, i) => {
    const textData = element.customData as TextData;
    annotations.push({min: textData.startIndex, max: textData.endIndex, style: StyleSelection, data: {element: element, index: i, isLoading: false}})
  });

  // Mark up loading elements
  loadingElements.forEach((element, i) => {
    const textData = element.customData as TextData;
    annotations.push({min: textData.startIndex, max: textData.endIndex, style: StyleSelection, data: {element: element, index: i, isLoading: true}})
  });

  // Mark up differences compared to previous text
  if (!props.disableDiffMarkup && history.length > 0) {
    const previousHistory = history[history.length-1];
    const previousText = previousHistory.gptMessages[previousHistory.gptMessages.length-1].content;
    const currentText = getLastGptMessage().content;

    let index = 0;
    Diff.diffWordsWithSpace(previousText, currentText).forEach((part) => {
      if (part.added) {
        annotations.push({min: index, max: index + part.value.length, style: StyleBold})
      }
      if (!part.removed) {
        index += part.value.length;
      }
    });
  }

  useEffect(() => {
    const mouseDownListener = (e : MouseEvent) => {
      // IF not targetting an element that has an id
      /*if ((e.target as HTMLElement).id === "") {
        const tmpElements = (e.ctrlKey || e.metaKey || inMultipleSelectionMode) ? [...selectedElements] : []; 
        setSelectedElements(tmpElements);
      }*/
    }

    // Install event listener for mouseup
    const mouseUpListener = (e : MouseEvent) => {
      const selection = window.getSelection();
      const selectionLength = selection?.toString().length || 0;

      // Test if anchorNode has selectableText as an ancestor
      let anchorNode = selection?.anchorNode as HTMLElement | null;
      let hasSelectableTextAncestor = false;
      while (anchorNode !== null) {
        if (anchorNode.id === 'selectableText') {
          hasSelectableTextAncestor = true;
          break;
        } else if (anchorNode.id === 'prompt-builder') {
          break;
        }
        anchorNode = anchorNode.parentElement;
      }

      // Add the selection to our list everytime the user selects something
      if (hasSelectableTextAncestor && selection?.anchorNode) {
        const tmpElements = (e.ctrlKey || e.metaKey || inMultipleSelectionMode) ? [...selectedElements] : []; // Support multiple selections
        if (selectionLength > 0) {
          let rangeAnchor = document.createRange();
          rangeAnchor.setStart(document.getElementById("selectableText") as Node, 0);
          rangeAnchor.setEnd(selection.anchorNode, selection.anchorOffset);
          const anchorText = rangeAnchor.toString()

          let rangeFocus = document.createRange();
          rangeFocus.setStart(document.getElementById("selectableText") as Node, 0);
          rangeFocus.setEnd(selection.focusNode as Node, selection.focusOffset);
          const focusText = rangeFocus.toString()

          const precedingText = anchorText.length < focusText.length || !selection.focusNode ? anchorText : focusText;
          const newRange = {startIndex: precedingText.length, endIndex: precedingText.length + selectionLength, text: selection.toString(), rectangle: selection.getRangeAt(0).getBoundingClientRect()};

          // Merge with existing selections if it intersects one of them
          let idx = 0;
          while (idx < tmpElements.length) {
            const tmpSelection = tmpElements[idx].customData as TextData;
            const rangeMin = newRange.startIndex < tmpSelection.startIndex ? newRange : tmpSelection;
            const rangeMax = rangeMin === newRange ? tmpSelection : newRange;

            // Test if tmpSelection instersects with the new range
            if (rangeMin.endIndex >= rangeMax.startIndex) {
              // Intersect, so we merge and remove that selection as it now uselesss
              newRange.startIndex = Math.min(tmpSelection.startIndex, newRange.startIndex);
              newRange.endIndex = Math.max(tmpSelection.endIndex, newRange.endIndex);
              newRange.text = gptOutput.substring(newRange.startIndex, newRange.endIndex);
              // Calculate the union of the two rectangles
              const rect1 = tmpSelection.rectangle;
              const rect2 = newRange.rectangle;
              newRange.rectangle = new DOMRect(Math.min(rect1.x, rect2.x), Math.min(rect1.y, rect2.y), Math.max(rect1.width, rect2.width), Math.max(rect1.height, rect2.height));

              tmpElements.splice(idx, 1);
              idx = 0;
            } else {
              ++idx;
            }
          }
          const rect = newRange.rectangle;
          const text = selection.toString();
          // Shorten the text to the first 4 and last 4 characters
          const elementPrompt = text.length > 16 ? text.substring(0, 8) + " [...] " + text.substring(text.length - 8, text.length) : text;

          tmpElements.push({
            customData: newRange,
            htmlRepresentation: <>{elementPrompt}</>,
            textRepresentation: selection.toString(),
             x: newRange.rectangle.x, y: newRange.rectangle.y, width: newRange.rectangle.width, height: newRange.rectangle.height});
        }

        setSelectedElements(tmpElements);
        window.getSelection()?.removeAllRanges();
      }
    }

    document.addEventListener("mouseup", mouseUpListener);
    document.addEventListener("mousedown", mouseDownListener);

    return () => {
      document.removeEventListener("mouseup", mouseUpListener);
      document.removeEventListener("mousedown", mouseDownListener);
    }
  }, [gptMessages, selectedElements, setSelectedElements, inMultipleSelectionMode]);


  useEffect(() => {
    const textSelectionPrompt = document.getElementById("textSelectionPrompt");
    if (textSelectionPrompt) {
      textSelectionPrompt.focus();
      window.getSelection()?.selectAllChildren(textSelectionPrompt as Node);
    }
  }, [selectedElements]);

  return (
    <div style={{display: 'flex', justifyContent: 'left', width: '100%' }}>
      <p id="selectableText" style={{ textAlign: 'left', whiteSpace: 'break-spaces', lineHeight: '1.5rem', maxWidth: 600, margin: 0, ...props.style }}
      ><OverlappingMarkup text={gptOutput} styling={annotations}/></p>
    </div>
  );
}

