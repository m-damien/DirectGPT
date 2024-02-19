import { EntityElement, TextData } from "../Element";
import { ComplexPrompt, PromptElement, SubPrompt } from "./ComplexPrompt";


export class TextPrompt extends ComplexPrompt {
  subPromptResults : {target : EntityElement, result : string}[];

  constructor(entityStr: string, target: EntityElement[], promptElements: PromptElement[], isReusable: boolean = true) {
    super(entityStr, target, promptElements, isReusable);
    this.subPromptResults = [];
  }

  // When replacing text, it happens that gpt will re-write the word being replaced
  // We make sure to clean this if it happens
  cleanReplacement(target : EntityElement, result: string) : string {
    const previousText = this.entityStr.substring((target.customData as TextData).startIndex, (target.customData as TextData).endIndex);
    if (result.startsWith(previousText + " -> ")) {
      result = result.substring(previousText.length + " -> ".length);
    }

    if (result.startsWith("<blank>: ")) {
      result = result.substring("<blank>: ".length);
    }

    // Extract spaces around the previousText
    const spacesBefore = previousText.match(/^(\s*)/);
    const spacesAfter = previousText.match(/(\s*)$/);

    // Restore the spaces
    result = spacesBefore![0] + result.trim() + spacesAfter![0];
    
    return result
  }

  getCleanResult(result: string): string {
    result.replace("<blank>: ", "");
    if (this.targets.length > 0 && this.targets.length === this.subPromptResults.length) {
      // Create the result from the subprompts
      // First we sort the subprompt results by the target's start index
      this.subPromptResults.sort((a, b) => (a.target.customData as TextData).startIndex - (b.target.customData as TextData).startIndex);
      // Then we re-create the result and replace targets with their results
      let result = "";
      let lastOffset = 0;
      this.subPromptResults.forEach((e) => {
        result += this.entityStr.substring(lastOffset, (e.target.customData as TextData).startIndex) + this.cleanReplacement(e.target, e.result);
        lastOffset = (e.target.customData as TextData).endIndex;
      });
      result += this.entityStr.substring(lastOffset, this.entityStr.length);

      return result;
    } else if (this.targets.length > 0) {
        // Because of how targetted prompts are worded, only the modified element is returned. So we should add the prefix and suffix to get the full result
        return this.entityStr.substring(0, (this.targets[0].customData as TextData).startIndex) + this.cleanReplacement(this.targets[0], result) + this.entityStr.substring((this.targets[0].customData as TextData).endIndex, this.entityStr.length);
    } else {
      // Remove the tags from the result
      let entityCounter = 0;
      this.promptElements.forEach((e) => {
        if (e.type === 'entity') {
          result = result.replace(new RegExp(`${entityCounter}\]`, "g"), "");
          entityCounter++;
        }
      });
      return result;
    }
  }

  getTypeStr() {
    return "text"
  }


  getTaggedEntityStr(entityStr: string, target: EntityElement | null = null) {
    // Modify entityStr to add tags for the target and entities
    const elementsToTag = []

    // TODO: The reference to an entity could be stale. We should have some mechanism to make sure this is not the case (and maybe find the closest entity if it is the case)
    if (target) {
      elementsToTag.push({ sidx: (target.customData as TextData).startIndex, eidx: (target.customData as TextData).endIndex, isTarget: true });
    }

    this.promptElements.forEach((e) => {
      if (e.type === 'entity') {
        elementsToTag.push({ sidx: (e.entity.customData as TextData).startIndex, eidx: (e.entity.customData as TextData).endIndex, isTarget: false });
      }
    });

    elementsToTag.sort((a, b) => a.sidx - b.sidx);

    let taggedEntityStr = "";
    let lastOffset = 0;
    let entityCounter = 0;
    elementsToTag.forEach((e) => {
      taggedEntityStr += entityStr.substring(lastOffset, e.sidx);
      if (e.isTarget) {
        taggedEntityStr += '<blank>';
      } else {
        taggedEntityStr += `${entityCounter}]` + entityStr.substring(e.sidx, e.eidx) + `${entityCounter}]`;
        entityCounter++;
      }
      lastOffset = e.eidx;
    });
    taggedEntityStr += entityStr.substring(lastOffset, entityStr.length);

    return taggedEntityStr;
  }


  toGPTPrompt(currentEntityStr: string): SubPrompt[] {
    let entityCounter = 0;
    const instruction = this.promptElements.map((e) => e.type === "text" ? e.text : `${this.getTypeStr()} delimited by ${entityCounter++}]`).join('')


    const subPrompts = this.targets.map((e) => {
      const localPrompt = this.getTaggedEntityStr(currentEntityStr, e) + `
<blank>: ${currentEntityStr.substring((e.customData as TextData).startIndex, (e.customData as TextData).endIndex)}

INSTRUCTION: ${instruction}
Rewrite <blank>. Follow INSTRUCTION
<blank>:`

      const onDone = (result: string) => {
        this.subPromptResults.push({target: e, result: result});
      }
      return { promptStr: localPrompt, onDone: onDone };
    });

    if (subPrompts.length === 0) {
      subPrompts.push({ promptStr: this.getTaggedEntityStr(currentEntityStr) + "\n\n" + instruction + `\nKeep rest of the ${this.getTypeStr()} identical`, onDone: (result) => { } });
    }

    return subPrompts;
  }
}