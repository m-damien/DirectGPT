import { TextPrompt } from "./TextPrompt";

export class CodePrompt extends TextPrompt {
  // Add a static variable to store the regexp
  static REGEXP = /```[a-zA-Z]*\n([\s\S]+)\n```/m;

  getCleanResult(result: string): string {
    let cleanResult = super.getCleanResult(result);
    const match = result.match(CodePrompt.REGEXP)
    if (match) {
      cleanResult =  match[1];
    }

    // Fix indentation if necessary and the code contains brackets (otherwise this might be python or other unsupported languages)
    if (cleanResult.includes('{') && cleanResult.includes('}')) {
      const lines = cleanResult.split('\n');
      let indentation = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("}")) {
          indentation -= 2;
        }

        lines[i] = " ".repeat(Math.max(0, indentation)) + lines[i].trimStart();

        if (lines[i].trim().endsWith("{")) {
          indentation += 2;
        }
      }

      cleanResult = lines.join('\n');
    }

    return cleanResult;
  }

  getTypeStr() {
    return "code"
  }
}