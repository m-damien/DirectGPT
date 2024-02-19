import React from "react";
import { useStudyModelStore } from "./StudyModel";

export default function StudyMessage(props : { message : string}) {
  const nextStep = useStudyModelStore((state) => state.nextStep);

  return (<div style={{width: '100%', height: '100vh', display: "flex", justifyContent: "center", alignItems: "center"}}>
    <div style={{background: 'white', padding: 20, borderRadius: 5, maxWidth: 600}}>
      <span dangerouslySetInnerHTML={{__html: props.message}}></span>
      {<div style={{width: '100%', display: "flex", justifyContent: "right"}}>
          <button style={{marginTop: 15}} onClick={nextStep}>Next</button>
      </div>}
    </div>

</div>);

}

