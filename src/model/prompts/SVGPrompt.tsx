import { SVGData } from "../Element";
import { ComplexPrompt, SubPrompt } from "./ComplexPrompt";


export class SVGPrompt extends ComplexPrompt {
  // Add a static variable to store the regexp
  static REGEXP = /(<svg[\s\S]*<\/svg>)/m;
  
  /* Apply a regexp to the result just so that we extract only the SVG and nothing else */
  getCleanResult(result : string) {
    const match = result.match(SVGPrompt.REGEXP)
    if (match) {
      return match[0];
    }
    console.log("Could not find SVG in result");

    return this.entityStr; // Backup solution: we return what we had before
  }


  toGPTPrompt(currentEntityStr : string) : SubPrompt[] {
    if (this.targets.length === 0) {
      // No element selected, we just execute the prompt after the text
      return [{promptStr: `${currentEntityStr}\n"Return modified SVG code to ${this.toString()}`, onDone: (result) => {}}];
    }

    // SVG element selected, we need to specify the selection in the prompt
    // Extract all the selected ids or locations
    const locations: string[] = [];
    const ids: string[] = [];
    this.targets.forEach((element) => {
      const data = element.customData as SVGData;
      if (data.id.startsWith('location')) {
        locations.push(data.id.replace('location ', ''));
      } else {
        ids.push(data.id);
      }
    });

    const finalPrompt =
      `CODE: ${currentEntityStr}
INSTRUCTION: ${this.toString()}
${ids.length === 0 ? "" : "ID: " + ids.join(', ')}

Return modified CODE that applies INSTRUCTION${ids.length === 0 ? "" : " to ID"}${locations.length === 0 ? "" : " at location " + locations.join(" and ")}`

    return [{promptStr: finalPrompt, onDone: (result) => {}}];
  }
}