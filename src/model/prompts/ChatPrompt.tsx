import { ComplexPrompt, PromptElement, SubPrompt } from "./ComplexPrompt";


export class ChatPrompt extends ComplexPrompt {  
  constructor(promptElements : PromptElement[]) {
    super("", [], promptElements, false);
  }

  toGPTPrompt(currentEntityStr : string) : SubPrompt[] {
    return [{promptStr: `${this.toString()}`, onDone: (result) => {}}];
  }

}