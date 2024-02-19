import React from "react";
import { EntityElement } from "../../model/Element";
import { useModelStore } from "../../model/Model";
import { ComplexPrompt, PromptElement } from "../../model/prompts/ComplexPrompt";
import ReusablePromptButton from "./ReusablePromptButton";

export default function PromptReuseToolbar(props: { sendPrompt: (prompt: PromptElement[], selectedElement : EntityElement[]) => void }) {
  const history = useModelStore((state) => state.history);

  // Find reusable prompts by scanning the history
  const reusablePrompts : {[prompt: string]: ComplexPrompt} = {};
  history.forEach((h) => {
    if (h.prompt.isReusable) {
      const prompt = h.prompt.promptElements.map(e => e.type === 'text' ? e.text : '[]').join('');
      if (reusablePrompts[prompt] === undefined) {
        reusablePrompts[prompt] = h.prompt;
      }
    }
  });

  // Create toolbar buttons for each reusable prompt
  const reusablePromptButtons = Object.entries(reusablePrompts).map(([prompt, complexPrompt]) => {
    return <ReusablePromptButton key={prompt} reusablePrompt={complexPrompt} sendPrompt={props.sendPrompt} />
  });


  return (
    <div style={{ userSelect: 'none', maxHeight: '100%', width: 'fit-content', minWidth: 100, padding: 5, borderRadius: 5, background: reusablePromptButtons.length > 0 ? '#f4f4f4' : 'none', display: 'flex', flexWrap: 'wrap', flexDirection: 'column', justifyContent: 'center' }}>
      {reusablePromptButtons.length > 0 && <span style={{fontSize: 10, color: 'gray', paddingBottom: 5}}>Toolbar</span>}
      {reusablePromptButtons}
    </div>);
}

