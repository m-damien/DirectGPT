import { create } from 'zustand';
import { useModelStore } from '../../model/Model';
import { StudyStep } from './StudyTaskGenerator';


interface StudyModelState {
  participantId: number,
  stepId: number,
  steps: StudyStep[],
  taskId: number,
  csvData: string,
  isDataSaved: boolean,
}

interface StudyModelActions {
  setParticipantId: (participantId: number) => void,
  setStepId: (stepId: number) => void,
  setSteps: (steps: StudyStep[]) => void,
  nextStep: () => void,
  startFresh: () => void,
  getTaskCode: () => string,
  saveData: (clear?: boolean) => void,
  logEvent: (eventName: string, parameters?: any) => void,
  reset: () => void,
  setIsDataSaved: (isDataSaved: boolean) => void,
}

const initialState: StudyModelState = {
  participantId: -1,
  stepId: -1,
  steps: [],
  taskId: 0,
  csvData: "Timestamp,Participant,StepId,StepType,TaskId,TaskCode,Condition,Event,Parameters",
  isDataSaved: false,
}

export const useStudyModelStore = create<StudyModelState & StudyModelActions>()((set, get) => ({
  ...initialState,
  reset: () => set(() => ({ ...initialState })),
  setParticipantId: (participantId) => set((state) => ({ participantId: participantId })),
  setStepId: (stepId) => set((state) => ({ stepId: stepId })),
  setSteps: (steps) => set((state) => ({ steps: steps })),
  startFresh: () => {
    const currentStep = get().steps[get().stepId];

    // Reset the model
    const reset = useModelStore.getState().reset;
    reset();

    if (currentStep.type === 'condition' && currentStep.condition) {
      // Load necessary data into the model
      const setGptMessages = useModelStore.getState().setGptMessages;
      const setType = useModelStore.getState().setType;
      setType(currentStep.condition.type);
      setGptMessages(currentStep.condition.messages);
    }

  },
  nextStep: () => {

    // First check if there are still tasks (in which case we should go to the next task)
    const currentStep = get().steps[get().stepId];
    if (currentStep && currentStep.type === 'condition' && currentStep.condition && get().taskId + 1 < currentStep.condition.tasks.length) {
      set((state) => ({ taskId: state.taskId + 1 }))
      get().startFresh();
      get().logEvent("NEXT_STEP", { previous: currentStep, now: get().steps[get().stepId] });
      return;
    }

    if (get().stepId + 1 < get().steps.length) {
      set((state) => ({ stepId: state.stepId + 1, taskId: 0 }))
      get().logEvent("NEXT_STEP", { previous: currentStep, now: get().steps[get().stepId] });

      if (get().steps[get().stepId].saveData) {
        get().saveData(true);
      }
      get().startFresh();
    }
  },
  getTaskCode: () => {
    const currentStep = get().steps[get().stepId];
    if (currentStep && currentStep.type === 'condition' && currentStep.condition) {

      const conditionLetter = currentStep.isDirect ? 'D' : 'C';
      let modalityLetter = 'T';
      if (currentStep.condition.type === 'svg') {
        modalityLetter = 'S';
      } else if (currentStep.condition.type === 'code') {
        modalityLetter = 'C';
      }

      const taskLetter = ['LT', 'LA', 'LR', 'GT'][get().taskId];

      return `[${modalityLetter}_${conditionLetter}] ${taskLetter}`;
    }
    return "";
  },
  logEvent(eventName: string, parameters?: any) {
    if (get().isDataSaved) {
      let strParams = parameters ? btoa(unescape(encodeURIComponent(JSON.stringify(parameters)))) : "";

      const currentStep = get().steps[get().stepId];
      if (currentStep) {
        let condition = "";
        if (currentStep && currentStep.type === 'condition' && currentStep.condition) {
          condition = currentStep.isDirect ? 'direct' : 'chat';
        }
        const values = [Date.now(), get().participantId, get().stepId, currentStep.type, get().taskId, get().getTaskCode(), condition, eventName, strParams];
        set((state) => ({ csvData: state.csvData + "\n" + values.join(",") }));
      }
    }

  },

  saveData(clear = true): void {
    if (get().isDataSaved) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(get().csvData));
      element.setAttribute('download', "P" + get().participantId + "_" + get().stepId + ".csv");

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

      if (clear) {
        set((state) => ({ csvData: "" }))
      }
    }
  },

  setIsDataSaved: (isDataSaved) => set((state) => ({ isDataSaved: isDataSaved })),

}))