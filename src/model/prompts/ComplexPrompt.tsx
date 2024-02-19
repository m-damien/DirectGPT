import { EntityElement } from "../Element";

export interface TextPromptElement {
  text: string,
  type: "text",
}

export interface EntityPromptElement {
  entity: EntityElement,
  type: "entity",
}

export interface SubPrompt {
  promptStr: string,
  onDone: (result : string) => void,
}

export type PromptElement = TextPromptElement | EntityPromptElement;

export class ComplexPrompt {
  entityStr : string;
  targets: EntityElement[];
  promptElements: PromptElement[];
  isReusable: boolean;

  constructor(entityStr: string, target: EntityElement[], promptElements: PromptElement[], isReusable: boolean = true) {
    this.entityStr = entityStr;
    this.targets = target;
    this.promptElements = promptElements;
    this.isReusable = isReusable;
  }

  toString() {
    return `${this.promptElements.map((e) => e.type === "text" ? e.text : e.entity.textRepresentation).join('')}`;
  }

  getLoadingElements() : EntityElement[] {
    // By default, all the targets and prompt elements should be shown as loading
    return this.promptElements.filter((e) => e.type === 'entity').map((e) => (e as EntityPromptElement).entity).concat(this.targets);
  }

  toGPTPrompt(currentEntityStr : string) : SubPrompt[] {
    return [{promptStr: `${currentEntityStr}\n${this.toString()}`, onDone: (result) => {}}];
  }

  getCleanResult(result: string) {
    return result;
  }
}