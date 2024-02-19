
export interface SVGData {
  id: string;
}

export interface TextData {
  startIndex: number;
  endIndex: number;
  text: string;
  rectangle: DOMRect;
}

export interface CodeData {
  id: string;
}

export interface EntityElement {
  x: number;
  y: number;
  width: number;
  height: number;
  htmlRepresentation: JSX.Element;
  textRepresentation: string;
  customData: SVGData | TextData | CodeData;
}
