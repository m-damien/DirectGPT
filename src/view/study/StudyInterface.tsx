import React from "react";
import ChatInterface from "../ChatInterface";
import DirectInterface from "../DirectInterface";
import CodeEntity from "../entities/CodeEntity";
import SVGEntity from "../entities/SVGEntity";
import TextualEntity from "../entities/TextualEntity";
import StudyMessage from "./StudyMessage";
import { useStudyModelStore } from "./StudyModel";
import { StudyCondition, StudyStep, StudyTaskGenerator } from "./StudyTaskGenerator";
import StudyVideo from "./StudyVideo";
import TaskPanel from "./TaskPanel";

export default function StudyInterface() {
  let participantId = useStudyModelStore((state) => state.participantId);
  let steps = useStudyModelStore((state) => state.steps);
  let stepId = useStudyModelStore((state) => state.stepId);
  const taskId = useStudyModelStore((state) => state.taskId);

  const setParticipantId = useStudyModelStore((state) => state.setParticipantId);
  const setSteps = useStudyModelStore((state) => state.setSteps);
  const setStepId = useStudyModelStore((state) => state.setStepId);
  const nextStep = useStudyModelStore((state) => state.nextStep);
  const getTaskCode = useStudyModelStore((state) => state.getTaskCode);
  const startFresh = useStudyModelStore((state) => state.startFresh);
  const logEvent = useStudyModelStore((state) => state.logEvent);
  const setIsDataSaved = useStudyModelStore((state) => state.setIsDataSaved);

  // Use URL parameters to generate the steps
  const hashSplitted = window.location.hash.split("?");
  const search = hashSplitted[hashSplitted.length-1]
  const params = new URLSearchParams(search);
  const pid = params.get('pid');
  const pstepId = params.get('stepId');
  const dataSaved = params.get('dataSaved');


  setIsDataSaved(dataSaved === "true");
  if (participantId === -1 && pid) {
    setParticipantId(participantId = parseInt(pid))
    setSteps(StudyTaskGenerator.generateSteps(participantId))
    // In case of failure, we allow jumping to a specific step directly
    if (pstepId) {
      setStepId(stepId = parseInt(pstepId));
    } else {
      nextStep();
    }
  }

  if (participantId < 0) {
    return <StudyMessage message="Error: Make sure the URL is correct." />
  }

  let currentStep: StudyStep | null = null;
  if (stepId < steps.length) {
    currentStep = steps[stepId];
  }

  if (currentStep) {

    if (currentStep.type === 'message') {
      return <StudyMessage message={currentStep.message || ""} />
    } else if (currentStep.type === 'video') {
      return <StudyVideo video={currentStep.video || ""} />
    } else if (currentStep.type === 'condition') {
      const condition = currentStep.condition as StudyCondition;
      
      let currentInterface = <></>;

      if (currentStep.isDirect) {
        let entity = <></>
        if (condition.type === 'svg') {
          entity = <SVGEntity/>
        } else if (condition.type === 'text') {
          entity = <TextualEntity/>
        } else if (condition.type === 'code') {
          entity = <CodeEntity/>
        }
        currentInterface = <DirectInterface leftSide={<TaskPanel task={condition.tasks[taskId]}/>}>{entity}</DirectInterface>
      } else {
        currentInterface = <ChatInterface leftSide={<TaskPanel task={condition.tasks[taskId]}/>}></ChatInterface>
      }

      // Render the current step
      return <>{currentInterface}
      <div style={{position: 'absolute', bottom: 10, left: 10, zIndex: 999, color: 'gray'}}><button onClick={() => {logEvent("USER_PRESSED_RESET"); startFresh()}}>Reset</button></div>
      <div style={{position: 'absolute', bottom: 10, right: 10, zIndex: 999, color: 'gray', pointerEvents: 'none'}}>{getTaskCode()}</div>
      </>;
    }
  }

  return <StudyMessage message="Study is loading..." />
}

