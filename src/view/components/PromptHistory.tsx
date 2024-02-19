import { faEye, faPencil } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useModelStore } from "../../model/Model";

export default function PromptHistory() {
  const history = useModelStore((state) => state.history);

  const historyDivs = history.map((h, i) => {
    return <div id={`historyPrompt${i}`} className="draggable dark-hoverable"  key={i} style={{ background: 'rgb(30, 30, 30)', color: 'white', padding: 10, borderTop: '1px solid #333333', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
        <div style={{ minWidth: '10px',  backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '5px 5px' }}/>
        <div style={{textAlign: 'left', fontSize: '.875rem'}}>
          {h.prompt.toString()}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <button className="dark-clickable" style={{background: 'none', border: 'none', color: 'white', margin: 0, padding: 0}}><FontAwesomeIcon icon={faPencil} /></button>
        <button className="dark-clickable" style={{background: 'none', border: 'none', color: 'white', margin: 0, padding: 0}}><FontAwesomeIcon icon={faEye} /></button>
      </div>
    </div>
  });

  return (
    <div style={{ background: 'rgb(30, 30, 30)', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflowY: 'auto' }}>
      {historyDivs}
    </div>);
}

