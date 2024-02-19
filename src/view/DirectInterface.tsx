import { faRedo, faUndo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import { EntityElement } from "../model/Element";
import { MessageGPT, useModelStore } from '../model/Model';
import { CodePrompt } from "../model/prompts/CodePrompt";
import { ComplexPrompt, PromptElement } from "../model/prompts/ComplexPrompt";
import { SVGPrompt } from "../model/prompts/SVGPrompt";
import { TextPrompt } from "../model/prompts/TextPrompt";
import { UnknownPrompt } from "../model/prompts/UnknownPrompt";
import CustomCursor from "./components/CustomCursor";
import DragnDrop from './components/DragnDrop';
import PromptBuilder from './components/PromptBuilder';
import PromptReuseToolbar from "./components/PromptReuseToolbar";

export default function DirectInterface(props: { children: React.ReactNode, leftSide?: React.ReactNode }) {
  const executePrompt = useModelStore((state) => state.executePrompt);
  const type = useModelStore((state) => state.type);
  const getLastGptMessage = useModelStore((state) => state.getLastGptMessage);
  const undo = useModelStore((state) => state.undo);
  const redo = useModelStore((state) => state.redo);
  const history = useModelStore((state) => state.history);
  const redoStack = useModelStore((state) => state.redoStack);
  const selectedElements = useModelStore((state) => state.selectedElements);
  const setSelectedElements = useModelStore((state) => state.setSelectedElements);
  const setSelectedTool = useModelStore((state) => state.setSelectedTool);
  const setLoadingElements = useModelStore((state) => state.setLoadingElements);
  const setHistory = useModelStore((state) => state.setHistory);

  // Direct Interface supports undo/redo
  useEffect(() => {
    // Add listener for keyboard shortcuts to undo/redo
    const keydownListener = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.key === 'y') || (event.metaKey && event.shiftKey && event.key === 'z')) {
        redo();
        event.preventDefault();
        event.stopPropagation();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        undo();
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === 'Escape') {
        if (selectedElements.length > 0) {
          setSelectedElements([]);
        } else {
          setSelectedTool('');
        }
      } else if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
        if (window.getSelection() || window.getSelection()?.toString().length === 0 && selectedElements.length > 0) {
          const selectedText = selectedElements.map(e => e.textRepresentation).join(' ');
          navigator.clipboard.writeText(selectedText);
        }
      } else if (event.key.length === 1 && event.key !== ' ') {
        // Otherwise, if just a simple letter key is pressed, we should make sure it types it inside the text box
        const promptBuilder = document.getElementById('main-prompt-builder');
        promptBuilder?.focus();
        // propagate the mouse event
        const keydownEvent = new KeyboardEvent('keydown', { key: event.key, code: event.code, charCode: event.charCode, keyCode: event.keyCode, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey });
        promptBuilder?.dispatchEvent(keydownEvent);
      }
    };

    document.addEventListener('keydown', keydownListener);

    return () => {
      document.removeEventListener('keydown', keydownListener);
    }
  }, [selectedElements]);

  useEffect(() => {
    const mouseDownListener = (e: MouseEvent) => {
      // A bit hacky, but basically whenever a click happens on a seemingly uninteresting div (no id), then we unselect
      // This should support easy unselcting by clicking on the background
      if (e.target instanceof HTMLDivElement && !e.target.id) {
        setSelectedElements([]);
      }
    }
    window.addEventListener('mousedown', mouseDownListener);
    return () => {
      window.removeEventListener('mousedown', mouseDownListener);
    }
  }, [])

  function onPromptButtonPressed(promptElements: PromptElement[], stopLoading: () => void, _selectedElements: EntityElement[]) {
    // Direct Interface prompting does something different depending on the selection
    let complexPrompt = null;
    let isStreamed = true; // Answer is streamed by default but should be disabled in some cases
    let useChatGptSystemPrompt = false;
    if (type === "text") {
      complexPrompt = new TextPrompt(getLastGptMessage().content, _selectedElements, promptElements);
    } else if (type === "svg") {
      const svgDiv = document.getElementById("svgEntityDiv");
      isStreamed = false;
      if (svgDiv) {
        const svgElement = (svgDiv.firstChild as SVGGraphicsElement)
        const svgCode = svgElement.outerHTML;
        complexPrompt = new SVGPrompt(svgCode, _selectedElements, promptElements);
      }
    } else if (type === "code") {
      complexPrompt = new CodePrompt(getLastGptMessage().content, _selectedElements, promptElements);
    } else if (type === "unknown") {
      isStreamed = false;
      useChatGptSystemPrompt = true; // We have no idea what the user might ask, should behave like chatgpt
      complexPrompt = new UnknownPrompt(getLastGptMessage().content, _selectedElements, promptElements);
    }

    if (complexPrompt) {
      setSelectedElements([]);
      //setLoadingElements(selectedElements);
      executePrompt(complexPrompt, () => {
        setSelectedElements([]);
        //setLoadingElements([]);
        stopLoading()
      }, false, useChatGptSystemPrompt, isStreamed, () => { setSelectedElements([]); setLoadingElements([]); });
    }
  }

  return <div className="App">
    <DragnDrop></DragnDrop>
    <CustomCursor></CustomCursor>
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'row', justifyContent: 'center' }} onDragOver={(e) => {
      // If it hovers an element that doesnt have an id
      if (e.target instanceof HTMLDivElement && !e.target.id) {
        e.preventDefault();
      }
    }}

    onDrop={(e) => {
      if (e.target instanceof HTMLDivElement && !e.target.id) {
        const prompt = e.dataTransfer.getData('text/plain');
        // Find the corresponding prompt in history
        const newHistory : {prompt: ComplexPrompt, gptMessages: MessageGPT[]}[] = [];
        history.forEach((h) => {
          const newEntry = {...h}
          if (h.prompt.promptElements.map(e => e.type === 'text' ? e.text : '???').join('') === prompt) {
            newEntry.prompt.isReusable = false;
          }
          newHistory.push(newEntry);
        });

        setHistory(newHistory);
      }
    }}
    >
      <div style={{ flexGrow: 1}}>{props.leftSide}</div>

      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 5, maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
          <button disabled={history.length === 0} className="simpleButton" onClick={undo}><FontAwesomeIcon icon={faUndo} /> Undo</button>
          <button disabled={redoStack.length === 0} className="simpleButton" onClick={redo}><FontAwesomeIcon icon={faRedo} /> Redo</button>
        </div>
        <div style={{ overflow: 'auto' }} id="object-of-interest">
          {props.children}
        </div>
        <div style={{ width: '100%', padding: 10, borderTop: '1px solid #d9d9e3' }}>
          <PromptBuilder
            id="main-prompt-builder"
            draggable={false}
            onSendCallback={(prompt, stopLoading) => onPromptButtonPressed(prompt, stopLoading, selectedElements)}></PromptBuilder>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }}><PromptReuseToolbar sendPrompt={(prompt, selectedElements) => onPromptButtonPressed(prompt, () => { }, selectedElements)}></PromptReuseToolbar></div>
    </div>
  </div>
}
