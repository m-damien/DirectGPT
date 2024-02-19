import React from "react";
import { useModelStore } from '../../model/Model';
// @ts-ignore
import CodeEntity from "./CodeEntity";
import SVGEntity from "./SVGEntity";
import TextualEntity from "./TextualEntity";


export default function UnknownEntity() {
  const type = useModelStore((state) => state.type);

  // return the entity corresponding to the type
  if (type === 'text') {
    return <TextualEntity />
  } else if (type === 'svg') {
    return <SVGEntity />
  } else if (type === 'code') {
    return <CodeEntity />
  } 

  // Unknown entity, we return an empty div
  return <div></div>
}