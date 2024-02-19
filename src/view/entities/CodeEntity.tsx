import Prism from 'prismjs';
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";
import React, { useEffect, useRef } from "react";
import { useModelStore } from '../../model/Model';
import TextualEntity from "./TextualEntity";


export default function CodeEntity() {
  const getLastGptMessage = useModelStore((state) => state.getLastGptMessage);
  const gptMessages = useModelStore((state) => state.gptMessages);
  const codeBlockRef = useRef<any>(null);



  useEffect(() => {
    if (codeBlockRef.current) {
      Prism.highlightElement(codeBlockRef.current);
    }
  }, [gptMessages]);

  return (
    <>{<div className="useNiceCodingFont" style={{position: 'relative', background: '#2d2d2d'}}>
      <TextualEntity disableDiffMarkup={true} style={{whiteSpace: 'pre', lineHeight: 1.5, padding: '1rem', color: 'rgba(0, 0, 0, 0)'}} selectionPadding={2}/>
      <pre style={{position: 'absolute', top: 0, left: 0, zIndex: 999, padding: '1rem', margin: 0, background: 'none', pointerEvents: 'none'}}>
        <code style={{lineHeight: undefined}} className={`language-javascript`} ref={codeBlockRef} >{getLastGptMessage().content}</code>
      </pre>
  </div>}
    </>
  );
}


