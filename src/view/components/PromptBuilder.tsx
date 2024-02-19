import { faCancel, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import ContentEditable from 'react-contenteditable';
import ReactDOMServer from 'react-dom/server';
import { EntityElement } from "../../model/Element";
import { DraggingParameters, useModelStore } from "../../model/Model";
import { PromptElement } from "../../model/prompts/ComplexPrompt";
import { useStudyModelStore } from "../study/StudyModel";



export default function PromptBuilder(props: { style?: React.CSSProperties, draggable?: boolean, id?: string, onSendCallback: (prompt: PromptElement[], stopLoading: () => void) => void }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [isSpannified, setIsSpannified] = useState(false);
  const [endOfPromptHovered, setEndOfPromptHovered] = useState(false);
  const [storedEntities, setStoredEntities] = useState<{[name: string]: EntityElement}>({});
  const selectedElements = useModelStore((state) => state.selectedElements);
  const hoveredElements = useModelStore((state) => state.hoveredElements);
  const setSelectedElements = useModelStore((state) => state.setSelectedElements);
  const setSelectedTool = useModelStore((state) => state.setSelectedTool);
  const setHoveredElements = useModelStore((state) => state.setHoveredElements);
  const getHoveredElements = useModelStore((state) => state.getHoveredElements);
  const logEvent = useStudyModelStore((state) => state.logEvent);
  const clearPromptQueue = useModelStore((state) => state.clearPromptQueue);

  const setDraggingParameters = useModelStore((state) => state.setDraggingParameters);
  const promptQueue = useModelStore((state) => state.promptQueue);

  const dragging = useModelStore((state) => state.dragging);
  const draggingParameters = useModelStore((state) => state.draggingParameters);

  const sendRequest = () => {
    if (props.onSendCallback) {
      const prompt = getPromptElement();

      if (prompt.length > 0)
        logEvent("USER_SEND_PROMPT", { prompt: prompt });
        props.onSendCallback(prompt, () => {
          setHtmlContent("");
        });
    }
  }

  const divRef = React.useRef<HTMLDivElement>(null);
  const editableContentRef = React.useRef<HTMLDivElement>(null);

  function getPromptElement(): PromptElement[] {
    if (editableContentRef.current && (editableContentRef.current as HTMLDivElement).childNodes) {
      // Loop through the html in the div
      // Retrieve the text as is
      // Retrieve the data-text attributes
      // Concatenate all of it
      const children = (editableContentRef.current as HTMLDivElement).childNodes;
      const promptArray: PromptElement[] = [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeName === "#text") {
          promptArray.push({ text: child.textContent || "", type: 'text' });
        } else if (child.nodeName === "SPAN") {
          const dataText = (child as HTMLSpanElement).getAttribute("data-text");
          if ( (child as HTMLSpanElement).className.includes("plain-text")) {
            promptArray.push({ text: dataText || "", type: 'text' });
          } else {
            const entity = storedEntities[dataText  || "????"];
            if (entity) {
              promptArray.push({ entity: entity, type: 'entity' });
            }
          }
        } else if (child.nodeName === "DIV") {
          promptArray.push({ text: "\n" + child.textContent || "", type: 'text' });
        }
      }

      return promptArray;
    }

    return [];
  }

  function spanToString(htmlSpan: HTMLSpanElement) {
    let str = "";
    htmlSpan.childNodes.forEach((node) => {
      if (node.nodeName === "#text") {
        str += (node as Text).textContent;
      } else if (node.nodeName === "SPAN" && (node as HTMLSpanElement).className.includes("plain-text")) {
        str += spanToString(node as HTMLSpanElement);
      } else {
        str += (node as HTMLElement).outerHTML;
      }
    });
    return str;
  }

  function spannifyHtml(reverse: boolean = false) {
    // Do nothing if the html is already spannified/unspannified
    if (isSpannified === !reverse) return;

    let spannedHtml = "";
    const contentEditable = editableContentRef.current;
    // Go through the text (i.e., whatever is not in a subhtml element)
    if (contentEditable) {
      const nodes = (contentEditable as HTMLElement).childNodes;
      const createSpan = (p1: string, className = "plain-text") => `<span onmouseover="event.preventDefault();this.style.backgroundColor='#f2ebd7';" onmouseout="this.style.backgroundColor='';" class="${className} droppable" data-text="${p1}">${p1}</span>`;
      nodes.forEach((node, i) => {
        if (node.nodeName === "#text") {
          let text = (node as Text).textContent || "";
          // Create spans from words and spaces so that they become insert points when dropping
          text = text.replace(/(\S+|\s+)/g, (match, p1, offset, string) => {
            return createSpan(p1);
          });

          spannedHtml += text;
        } else if (node.nodeName === "SPAN") {
          if (reverse && (node as HTMLSpanElement).className.includes("plain-text")) {
            if (!(node as HTMLSpanElement).className.includes("ignore")) {
              // Replace the span with a text node
              spannedHtml += spanToString(node as HTMLSpanElement);
            }
          } else {
            // convert the HTML to a string
            spannedHtml += (node as HTMLSpanElement).outerHTML;
          }
        }
      });

      if (!reverse) {
        // We always add a final span so that text can be appended at the end
        spannedHtml += createSpan("&nbsp;", "plain-text ignore end-of-prompt");
      }
    }
    setHtmlContent(spannedHtml);
    setIsSpannified(!reverse);
  }

  useEffect(() => {
    if (dragging) {
      spannifyHtml();
    } else {
      spannifyHtml(true);
    }
  }, [dragging]);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // if does not have keyboard focus
        if (document.activeElement !== editableContentRef.current) {
          if (!e.shiftKey) {
            if (htmlContent.length === 0) return;
            sendRequest();
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }
    }
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
    }
  }, [htmlContent]);

  const isLoading = promptQueue.length > 0;

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'center', ...props?.style }}>
      <div ref={divRef} id="prompt-builder" className={`prompt-builder${props.draggable ? " draggable" : ""}${isLoading ? ' loading' : ''}`}
        style={{ padding: 10, display: 'flex', flexDirection: 'row', width: '100%', maxWidth: 750 }}
        onMouseDown={(e) => {
          if (props.draggable && divRef.current !== null && divRef.current.parentElement !== null) {
            // get mouse coordinate relative to the div
            //const offsetX = e.clientX - divRef.current?.parentElement?.getBoundingClientRect().left;
            //const offsetY = e.clientY - divRef.current?.parentElement?.getBoundingClientRect().top;
            // Offset the shadow
            //const offsetX = divRef.current?.getBoundingClientRect().left - divRef.current?.parentElement?.getBoundingClientRect().left;
            //const offsetY = divRef.current?.getBoundingClientRect().top - divRef.current?.parentElement?.getBoundingClientRect().top;

            //startDragging("prompt-builder", true, 0, 0, getPrompt())
          }

        }}
      >
        {props.draggable && <div style={{ width: '20px', marginRight: 10, backgroundImage: 'radial-gradient(#333333 1px, transparent 0)', backgroundSize: '5px 5px' }} />}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}
          onKeyDown={(e) => {
            // Cancel the selected tool because we probably don't want it anymore
            setSelectedTool('');

            if (e.key === 'Enter' && !e.shiftKey) {
              if (htmlContent.length === 0) return;
              sendRequest();
              e.stopPropagation();
              e.preventDefault();
            }
          }}

        >
          <div style={{width: '100%', position: 'relative'}}>
            <ContentEditable
              id={props.id}
              innerRef={editableContentRef}
              className="editable-cursor"
              // @ts-ignore
              placeholder={"Type your prompt here."}
              style={
                {
                  width: '100%', boxSizing: 'border-box',
                  fontSize: '1rem', background: 'white',
                  borderRadius: 3, textAlign: 'left',
                  paddingTop: 10, paddingBottom: 10,
                  paddingLeft: 10,
                  cursor: (dragging && endOfPromptHovered) ? 'copy' : 'text'
                }}
              html={htmlContent} // innerHTML of the editable div
              disabled={false}       // use true to disable editing

              onPaste={(e) => {
                // Remove the style to keep only the raw text
                const text = e.clipboardData?.getData('text/plain');
                if (text) {
                  e.preventDefault();
                  document.execCommand('insertText', false, text);
                }
              }}

              onMouseEnter={(e) => {
                // Adjust offset so that the object being dragged does not hide the prompt
                const newDragParams : DraggingParameters[] = []
                let needUpdate = false;
                draggingParameters.forEach((draggingParameter, i) => {
                  const newOffsetX = 0 - i * 15
                  const newOffsetY = 0 - i * 15
                  if (draggingParameter.offsetX !== newOffsetX || draggingParameter.offsetY !== newOffsetY) {
                    needUpdate = true;
                  }
                  newDragParams.push({ ...draggingParameter, offsetX: newOffsetX, offsetY: newOffsetY });
                });
                if (needUpdate) setDraggingParameters(newDragParams);
              }
              }
              onMouseMove={(e) => {
                if (dragging) {
                  if (e.target && !(e.target as any).className.includes("plain-text")) {
                    if (!endOfPromptHovered) setEndOfPromptHovered(true);
                  } else {
                    if (endOfPromptHovered) setEndOfPromptHovered(false);
                  }
                } else {
                  if (endOfPromptHovered) setEndOfPromptHovered(false);
                  // if we are hovering an entity in prompt we should mark it as hovered
                  if (e.target && (e.target as any).className.includes("text-in-prompt")) {
                    // Retrieve the corresponding entity
                    const dataText = (e.target as HTMLSpanElement).getAttribute("data-text");
                    const entity = storedEntities[dataText || "????"];
                    if (getHoveredElements().length === 0 || getHoveredElements()[0] !== entity) {
                      logEvent("USER_HOVER_PROMPT_ENTITY", entity);
                      setHoveredElements([entity])
                    }
                  } else {
                    if (getHoveredElements().length > 0) {
                      setHoveredElements([])
                    }
                  }
                }
              }}

              onMouseLeave={(e) => {
                setHoveredElements([]);
              }}

              onDrop={() => {
                // Make sure the text box is selected
                editableContentRef.current?.focus();
                // Remove text selection of the dropped element
                window.getSelection()?.removeAllRanges();
              }}

              onMouseUp={(e) => {
                if (dragging) {
                  // Create spans with the html representation of each dropped element
                  const draggedEntities = draggingParameters.map((e) => e.entities).flat();
                  const droppedHtml = draggedEntities.map(e => ReactDOMServer.renderToString(<><span suppressContentEditableWarning={true} contentEditable="false" className='text-in-prompt' data-text={e.textRepresentation}>{e.htmlRepresentation}&#8203;</span></>)).join(' ');


                  draggedEntities.forEach((entity) => {
                    storedEntities[entity.textRepresentation] = entity;
                  });
                  setStoredEntities(storedEntities);
                  
                  if ((e.target as any).className.includes("plain-text")) {
                    const spanTag = e.target as HTMLSpanElement;


                    function createElementFromHTML(htmlString: string) {
                      var div = document.createElement('div');
                      div.innerHTML = htmlString.trim();


                      return div.lastChild;
                    }

                    // Replace the spanTag by a node created from the dropped html
                    const droppedHtmlAsNode = createElementFromHTML(droppedHtml);
                    spanTag.replaceWith(droppedHtmlAsNode as any);

                    // Now update the prompt content using the new html
                    const promptContent = editableContentRef?.current?.innerHTML;
                    if (promptContent) {
                      logEvent("USER_DROPPED_ENTITIES_IN_PROMPT", {insteadOf: spanTag.textContent, promptBefore: getPromptElement(), draggedEntities});
                      setHtmlContent(promptContent);
                    }
                  } else {
                    // Dropped at the end
                    const space = "<span data-text=' ' class='plain-text'>&nbsp;</span>"
                    const precededBySpace = editableContentRef?.current?.textContent?.match(/.*\s\s$/) !== null
                    logEvent("USER_DROPPED_ENTITIES_IN_PROMPT", {atEnd: true, promptBefore: getPromptElement(), draggedEntities});
                    setHtmlContent(htmlContent + (precededBySpace? "" : space) +  droppedHtml + space);
                  }

                  // Make sure the text box is selected
                  editableContentRef.current?.focus();

                  // Remove dropped elements from selection
                  setSelectedElements(selectedElements.filter(e => !draggedEntities.includes(e)));
                }
              }}
              onChange={e => {
                setHtmlContent(e.target.value)
              }
              }
            />
            {selectedElements.length > 0 && <div style={{ position: 'absolute', right: -20, bottom: -28, background: 'rgb(170, 217, 251)', paddingRight: 5, paddingTop: 5, paddingBottom: 5, borderRadius: 3 }}>
              <button className="left-tag-button"><FontAwesomeIcon icon={faXmark} onClick={() => setSelectedElements([])} /></button> Apply to {selectedElements.length} selected element{selectedElements.length >= 2 ? 's' : ''}
            </div>}
            {isLoading && <button onClick={() => {logEvent("USER_STOP_GENERATION"); clearPromptQueue()}} className="simpleButton" style={{position: 'absolute', bottom: 5, right: -28}}><FontAwesomeIcon icon={faCancel}/> Stop generating</button>}
          </div>
          <button className={htmlContent.length === 0 ? "" : "clickable"} style={{ height: 28, marginBottom: 5, alignSelf: 'end', border: 'none', color: htmlContent.length === 0 ? 'black' : 'white', background: htmlContent.length === 0 ? 'none' : '#00A1FF', paddingTop: 5, borderRadius: 5 }}
            onClick={() => {
              if (htmlContent.length === 0) return;
              sendRequest();
            }}
          >
            {<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
            </svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

