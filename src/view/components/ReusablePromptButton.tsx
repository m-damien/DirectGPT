import React, { useEffect, useState } from "react";
import { EntityElement } from "../../model/Element";
import { useModelStore } from "../../model/Model";
import { ComplexPrompt, PromptElement } from "../../model/prompts/ComplexPrompt";
import { useStudyModelStore } from "../study/StudyModel";

export default function ReusablePromptButton(props: {  reusablePrompt : ComplexPrompt, sendPrompt: (prompt: PromptElement[], selectedElement : EntityElement[]) => void }) {
  const selectedElements = useModelStore((state) => state.selectedElements);
  const setSelectedElements = useModelStore((state) => state.setSelectedElements);
  const selectedTool = useModelStore((state) => state.selectedTool);
  const setSelectedTool = useModelStore((state) => state.setSelectedTool);
  const setInMultipleSelectionMode = useModelStore((state) => state.setInMultipleSelectionMode);
  const [hovered, setHovered] = useState(false);
  const logEvent = useStudyModelStore.getState().logEvent;


  const promptIdentifier = props.reusablePrompt.promptElements.map(e => e.type === 'text' ? e.text : '[]').join('');
  const isSelected = selectedTool === promptIdentifier;
  const nbSelectedElementRequired = props.reusablePrompt.promptElements.filter(e => e.type === 'entity').length + Math.min(1, props.reusablePrompt.targets.length);
  

  let tmpIdx = 0;
  const promptStr = (
    props.reusablePrompt.promptElements.map((e, i) => {
      if (e.type === 'entity') {
        tmpIdx++;
        if (isSelected && selectedElements.length === tmpIdx-1) {
          return <span key={i} style={{background: 'rgb(255, 255, 255)', borderRadius: 2, color: 'rgb(36, 37, 38', fontWeight: 600}}>?</span>
        } else if (tmpIdx-1 < selectedElements.length) {
          return  <span key={i}>{selectedElements[tmpIdx-1].htmlRepresentation}</span>
        }
      }
      return <span key={i}>{e.type === 'text' ? e.text : '?'}</span>
    }
  ));

  function selectedElementsToPromptElements(selectedElements : EntityElement[]) : PromptElement[] {
    const promptElements : PromptElement[] = [];
    let tmpIdx = 0;
    props.reusablePrompt.promptElements.forEach((e) => {
      if (e.type === 'entity') {
        promptElements.push({type: 'entity', entity: selectedElements[tmpIdx]});
        tmpIdx++;
      } else {
        promptElements.push(e);
      }
    });
    return promptElements;
  }



  /* Converts the selection into something that matches the prompt */
  function getPromptElementsAndSelection() : {promptElements: PromptElement[], selectedElements: EntityElement[]} {
    // Make sure it matches the signature of the prompt

    // Case 1: the prompt only has targets, then all selection stays selection 
    if (props.reusablePrompt.promptElements.length === 0 && props.reusablePrompt.targets.length > 0) {
      return {promptElements: props.reusablePrompt.promptElements, selectedElements: selectedElements};
    }

    // Case 2: the prompt only has entities, then all selection becomes an entity
    if (props.reusablePrompt.promptElements.length > 0 && props.reusablePrompt.targets.length === 0) {
      return {promptElements: selectedElementsToPromptElements(selectedElements), selectedElements: []};
    }

    // Case 3: the prompt has both entities and targets, then we use the first as a selectedElements and the rest as promptElements
    return {promptElements: selectedElementsToPromptElements(selectedElements.slice(1)), selectedElements: selectedElements.slice(0, 1)};
  }

  
  function onClick() {
    if (isSelected) {
      // Probably means users want to exit the mode
      setSelectedTool('');
      return;
    }

    // Already enough selected elements to execute the prompt, so we execute the prompt
    if (selectedElements.length >= nbSelectedElementRequired) {
      const parameters = getPromptElementsAndSelection();
      logEvent("PROMPT_REUSED_NOUN_VERB", {tool: promptIdentifier, prompt: parameters.promptElements, selectedElements: parameters.selectedElements});

      props.sendPrompt(parameters.promptElements, parameters.selectedElements);
      setSelectedTool('');
    } else {
      // Otherwise, we enter a mode until the user selects enough elements
      setSelectedTool(promptIdentifier);
      setInMultipleSelectionMode(true)
    }
  }


  useEffect(() => {
    if (isSelected && selectedElements.length >= nbSelectedElementRequired) {
      // We now have enough selected elements to apply the prompt
      const parameters = getPromptElementsAndSelection();
      logEvent("PROMPT_REUSED_VERB_NOUN", {tool: promptIdentifier, prompt: parameters.promptElements, selectedElements: parameters.selectedElements});
      props.sendPrompt(parameters.promptElements, parameters.selectedElements);
      setSelectedElements([]);
    }
  }, [isSelected, selectedElements]);

  return <button 
  draggable={true}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  className="reusablePromptButton"
  style={{position: 'relative', maxWidth: 100, maxHeight: 70, minWidth: 100, minHeight: 70, fontSize: 10, textAlign: 'center', ...(isSelected ? {background: '#d8d8d8', boxShadow: 'rgba(0, 0, 0, 0.75) 0px 1px 2px -1px inset'} : {})}}
  id={promptIdentifier}
  key={promptIdentifier}
  onClick={onClick}

  onDragStart={(e) => {
    e.dataTransfer.setData("text/plain", props.reusablePrompt.promptElements.map(e => e.type === 'text' ? e.text : '???').join(''));
  }}
  >
    {promptStr}
    {hovered && selectedElements.length >= nbSelectedElementRequired && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16" style={{position: 'absolute', right: 5, bottom: 5}}>
      <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
    </svg>}
</button>
}

