import { EntityElement } from "../Element";
import { ActivityType } from "../Model";
import { CodePrompt } from "./CodePrompt";
import { ComplexPrompt, PromptElement } from "./ComplexPrompt";
import { SVGPrompt } from "./SVGPrompt";


export class UnknownPrompt extends ComplexPrompt {
  detectedType : ActivityType;

  constructor(entityStr: string, target: EntityElement[], promptElements: PromptElement[], isReusable: boolean = true) {
    super(entityStr, target, promptElements, isReusable);
    this.detectedType = "unknown";
  }

  getCleanResult(result: string): string {
    this.detectedType = "text"; // Default to text
    // First, figure out the type of the result
    if (result.match(SVGPrompt.REGEXP)) {
      this.detectedType = "svg";
      return new SVGPrompt(this.entityStr, this.targets, this.promptElements).getCleanResult(result);
    } else if (result.match(CodePrompt.REGEXP)) {
      this.detectedType = "code";
      return new CodePrompt(this.entityStr, this.targets, this.promptElements).getCleanResult(result);
    }

    return result;
  }
}