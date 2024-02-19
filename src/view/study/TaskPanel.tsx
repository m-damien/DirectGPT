import React, { useEffect, useRef, useState } from "react";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import { useStudyModelStore } from "./StudyModel";
import { StudyTask } from "./StudyTaskGenerator";


const usePreviousEffect = (fn : any, inputs : any[] = []) => {
  const previousInputsRef = useRef([...inputs])

  useEffect(() => {
    const res = fn(previousInputsRef.current)
    previousInputsRef.current = [...inputs]
    return res;
  }, inputs)
}

export default function TaskPanel(props : {task: StudyTask}) {
  const nextStep = useStudyModelStore((state) => state.nextStep);
  const stepId = useStudyModelStore((state) => state.stepId);
  const taskId = useStudyModelStore((state) => state.taskId);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isInRateMode, setIsInRateMode] = useState(false);
  const [rateValue, setRateValue] = useState(0);
  const logEvent = useStudyModelStore((state) => state.logEvent);


  // Add a timer after 2 minutes to show the button in red to indicate user has to move on
  usePreviousEffect(([prevStepId, prevTaskId] : [number, number]) => {
    // Reset the timer if the task changes
    if (stepId !== prevStepId || taskId !== prevTaskId) {
      setIsTimeout(false);
      setIsInRateMode(false);
      setRateValue(0);
    }

    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, 1000 * 60 * 3);
    return () => clearTimeout(timer);
  }, [stepId, taskId]);

  return (<div style={{ 
      background: 'rgb(220, 220, 220)',
      userSelect: 'none', height: '100%', minWidth: 100,
      padding: 5, borderRadius: 5,
      maxWidth: 450,
      marginRight: 50,
       display: 'flex', flexWrap: 'wrap', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', alignContent: 'center' }}>
        <div style={{marginTop: 50, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: 300 }}>
          <span>{props.task.action}</span>

          {!isInRateMode &&
            <button style={{maxWidth: 100, marginTop: 20, background: isTimeout ? 'red' : undefined}} onClick={() => {
              logEvent('USER_CLICKED_DONE', {hasTimedout: isTimeout});
              setIsInRateMode(true);
            }}>Click when done</button>}

          {isInRateMode && <>

            <label htmlFor="distance" style={{marginTop: 30}}>How close are you to the target?</label><br />

            <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 5}}>
              <span>Distant</span>
            <input type="range" id="distance" name="distance" list="markers" min="1" max="5" value={rateValue} onChange={(e) => {setRateValue(parseInt(e.target.value))} } />
            <span>Close</span>
            <datalist id="markers">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value="4"></option>
              <option value="5"></option>
            </datalist>
            </div>

            <button disabled={rateValue === 0} style={{maxWidth: 100, marginTop: 5}} onClick={() => {
              logEvent('USER_RATED_AND_CLICKED_NEXT', {hasTimedout: isTimeout, rating: rateValue});
              nextStep();
            }}>Next</button>
          </>}




        </div>
        
        <div style={{position: 'relative', flexGrow: 1, width: '90%', margin: 20, maxWidth: 400, height: 'auto'}}>
          <div style={{maxWidth: '100%', maxHeight: '100%', position: 'absolute', left: 0, right: 0}}>
            <Zoom><img src={props.task.imageUrl} alt="" style={{maxWidth: '100%', maxHeight: '100%', width: 'max-content', height: 'auto', boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset'}}></img></Zoom>
          </div>
        </div>
    </div>);
}

