import OpenAI from 'openai';
import { create } from 'zustand';
import { useStudyModelStore } from '../view/study/StudyModel';
import { EntityElement } from './Element';
import { ComplexPrompt } from './prompts/ComplexPrompt';
import { UnknownPrompt } from './prompts/UnknownPrompt';

const SYSTEM_PROMPT = "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown."


const hashSplitted = window.location.hash.split("?");
const search = hashSplitted[hashSplitted.length-1]
const params = new URLSearchParams(search);
const key = params.get('k');
let gptModel = atob(params.get('m') || btoa('gpt-4-1106-preview'));


const openai = new OpenAI({
  apiKey: atob(key || ""),
  dangerouslyAllowBrowser: true
});

export interface MessageGPT {
  role: "user" | "assistant" | "system",
  content: string
}

export interface DraggingParameters {
  offsetX: number,
  offsetY: number,
  cloned: boolean,
  elementId: string,
  entities: EntityElement[],
  initialX: number,
  initialY: number
}

export interface QueuedPrompt {
  uniqueId: number,
  prompt: ComplexPrompt,
  doneCallback?: () => void,
  addToConversation?: boolean,
  useChatGptSystemPrompt?: boolean,
  stream?: boolean,
  streamStartCallback?: () => void
}

export type ActivityType = "text" | "svg" | "code" | "unknown"


interface ModelState {
  gptMessages: MessageGPT[]
  currentPrompt: ComplexPrompt
  dragging: boolean
  draggingParameters: DraggingParameters[]
  type: ActivityType
  history: { prompt: ComplexPrompt, gptMessages: MessageGPT[] }[]
  redoStack: { prompt: ComplexPrompt, gptMessages: MessageGPT[] }[]
  selectedElements: EntityElement[],
  loadingElements: EntityElement[],
  hoveredElements: EntityElement[],
  selectedTool: string,
  inMultipleSelectionMode: boolean
  promptQueue: QueuedPrompt[];
}

interface ModelAction {
  startDragging: (parameters: DraggingParameters[]) => void
  setDraggingParameters: (parameters: DraggingParameters[]) => void
  stopDragging: () => void
  _executeQueuedPrompt: (queuedPrompt: QueuedPrompt) => void
  executePrompt: (prompt: ComplexPrompt, doneCallback?: () => void, addToConversation?: boolean, useChatGptSystemPrompt?: boolean, stream?: boolean, streamStartCallback?: () => void) => void
  setLastGptMessage: (content: string) => void
  setGptMessages: (messages: MessageGPT[]) => void
  getLastGptMessage: () => MessageGPT
  setType: (type: "text" | "svg" | "code") => void
  setSelectedElements: (selections: EntityElement[]) => void
  setLoadingElements: (selections: EntityElement[]) => void
  setHoveredElements: (selections: EntityElement[]) => void
  getHoveredElements: () => EntityElement[]
  setSelectedTool: (tool: string) => void
  setInMultipleSelectionMode: (inMultipleSelectionMode: boolean) => void
  undo: () => void
  redo: () => void
  reset: () => void
  isLoading: () => boolean
  clearPromptQueue: () => void,
  setOpenAIKey: (key: string) => void,
  getOpenAIKey: () => string,
  setGptModel: (model: string) => void,
  getGptModel: () => string,
  setHistory: (history: { prompt: ComplexPrompt, gptMessages: MessageGPT[] }[]) => void,
}


const initialState: ModelState = {
  dragging: false,
  draggingParameters: [],
  currentPrompt: new ComplexPrompt("", [], []),
  promptQueue: [],
  type: "svg",
  history: [],
  redoStack: [],
  selectedElements: [],
  loadingElements: [],
  hoveredElements: [],
  gptMessages: [],
  selectedTool: '',
  inMultipleSelectionMode: false,
}

export const useModelStore = create<ModelState & ModelAction>()((set, get) => ({
  ...initialState,
  reset: () => set((state) => ({ ...initialState })),
  setInMultipleSelectionMode: (inMultipleSelectionMode) => set((state) => ({ inMultipleSelectionMode: inMultipleSelectionMode })),
  setSelectedTool: (tool) => {
    const logEvent = useStudyModelStore.getState().logEvent;
    if (get().selectedTool !== tool) logEvent("TOOL_SELECTED", { tool: tool });
    set((state) => ({ selectedTool: tool, inMultipleSelectionMode: false }))
  },
  setSelectedElements: (selectedElements) =>
    set((state) => {
      // Make sure there are no duplicated elements by checking the textRepresentation
      const uniqueElements = selectedElements.filter((e, i) => selectedElements.findIndex((e2) => e2.x === e.x && e2.y === e.y) === i);
      const logEvent = useStudyModelStore.getState().logEvent;
      if (uniqueElements.length !== selectedElements.length || uniqueElements.length > 0) logEvent("ELEMENTS_SELECTED", { elements: uniqueElements });
      return { selectedElements: uniqueElements }
    }),
  setLoadingElements: (loadingElements) => set((state) => ({ loadingElements: loadingElements })),
  setHoveredElements: (hoveredElements) => set((state) => ({ hoveredElements: hoveredElements })),
  getHoveredElements: () => get().hoveredElements,
  undo: () => set((state) => {
    if (get().isLoading()) {
      get().clearPromptQueue();
    } else if (state.history.length > 0) {
      const last = state.history[state.history.length - 1];
      const logEvent = useStudyModelStore.getState().logEvent;
      logEvent("UNDO", { restoredHistory: last });
      return {
        inMultipleSelectionMode: false,
        selectedTool: '',
        selectedElements: [],
        hoveredElements: [],
        loadingElements: [],
        history: state.history.slice(0, state.history.length - 1),
        currentPrompt: last.prompt,
        gptMessages: [...last.gptMessages],
        redoStack: [...state.redoStack, { prompt: state.currentPrompt, gptMessages: [...state.gptMessages] }]
      }
    }
    return {};
  }),
  redo: () => set((state) => {
    if (state.redoStack.length > 0) {
      const last = state.redoStack[state.redoStack.length - 1];
      const logEvent = useStudyModelStore.getState().logEvent;
      logEvent("REDO", { restoredHistory: last });
      return {
        inMultipleSelectionMode: false,
        selectedTool: '',
        selectedElements: [],
        hoveredElements: [],
        loadingElements: [],
        redoStack: state.redoStack.slice(0, state.redoStack.length - 1),
        currentPrompt: last.prompt,
        gptMessages: [...last.gptMessages],
        history: [...state.history, { prompt: state.currentPrompt, gptMessages: [...state.gptMessages] }]
      }
    }
    return {};
  }),

  setType: (type) => set((state) => ({ type: type })),
  setGptMessages: (messages) => set((state) => ({ gptMessages: messages })),
  setLastGptMessage: (content) => {
    if (get().gptMessages.length > 0) {
      set((state) => ({
        gptMessages: [...state.gptMessages.slice(0, state.gptMessages.length - 1), { role: "assistant", content: content }]
      }))
    }
    else {
      set((state) => ({
        gptMessages: [{ role: "assistant", content: content }]
      }))
    }
  },
  getLastGptMessage: () => {
    const gptMessages = get().gptMessages;
    if (gptMessages.length === 0) {
      return { role: "assistant", content: "" };
    }
    return gptMessages[gptMessages.length - 1];
  },
  startDragging: (parameters: DraggingParameters[]) => {
    const logEvent = useStudyModelStore.getState().logEvent;
    logEvent("START_DRAGGING", parameters);
    set((state) => ({
      dragging: true,
      draggingParameters: parameters
    }))
  },
  setDraggingParameters: (parameters: DraggingParameters[]) => set((state) => ({
    draggingParameters: parameters
  })),
  stopDragging: () => {
    const logEvent = useStudyModelStore.getState().logEvent;
    logEvent("STOP_DRAGGING");
    set((state) => ({ dragging: false, draggingParameters: [] }))},

  _executeQueuedPrompt: async (queuedPrompt: QueuedPrompt) => {
    const subPrompts = queuedPrompt.prompt.toGPTPrompt(get().getLastGptMessage().content);
    const logEvent = useStudyModelStore.getState().logEvent;

    // Show that the prompt is being executing by putting the references entities as loading
    set((state) => ({ loadingElements: queuedPrompt.prompt.getLoadingElements() }));

    let readStream;
    for (const subPrompt of subPrompts) {
      let conv: MessageGPT[] = queuedPrompt.addToConversation ? [...get().gptMessages, { role: "user", content: subPrompt.promptStr }] : [{ role: "user", content: subPrompt.promptStr }];
      if (queuedPrompt.addToConversation) set((state) => ({ gptMessages: conv }));

      if (queuedPrompt.useChatGptSystemPrompt) {
        conv = [{ role: "system", content: SYSTEM_PROMPT }, ...conv];
      }

      logEvent("PROMPT_SENT_TO_GPT", {
        uniqueId: queuedPrompt.uniqueId,
        model: gptModel,
        messages: conv,
        stream: subPrompts.length > 1 ? false : queuedPrompt.stream,
        "temperature": 0.2,
      });
      
      try {
        const localReadStream = await openai.chat.completions.create({
          model: gptModel,
          messages: conv,
          stream: subPrompts.length > 1 ? false : queuedPrompt.stream,
          "temperature": 0.2,
        });

        if (!(Symbol.asyncIterator in localReadStream)) {
          logEvent("SUBRESULT_FROM_GPT", { uniqueId: queuedPrompt.uniqueId, result: localReadStream.choices[0]?.message.content || '' });
  
          subPrompt.onDone(localReadStream.choices[0]?.message.content || '');
        }
        readStream = localReadStream;

      } catch (e) {
        alert(e);
      }
    
    }


    // Always add a message
    function addMessage() {
      set((state) => {
        let messages: MessageGPT[] = [...state.gptMessages];
        if (queuedPrompt.addToConversation) {
          messages.push({ role: "assistant", content: '' });
        } else {
          messages = [{ role: "assistant", content: '' }];
        }
        return {
          gptMessages: messages,
          history: [...state.history, { prompt: queuedPrompt.prompt, gptMessages: [...state.gptMessages] }], // Add an entry in the history
          redoStack: [], // Clear the redo stack because it is now invalid
        }
      });
    }


    // Only if readStream is iterable
    if (readStream) {
      if (Symbol.asyncIterator in readStream) {
        let result = "";
        let firstCall = true;
        let firstResultTimestamp = -1;
        let nbChunks = 0;
        let cancelled = false;
        for await (const part of readStream) {
          if (nbChunks === 0) {
            addMessage();
            firstResultTimestamp = new Date().getTime()
          }
          ++nbChunks;

          if (queuedPrompt.streamStartCallback && firstCall) {
            queuedPrompt.streamStartCallback();
            firstCall = false;
          }
          result += part.choices[0]?.delta?.content || ''
          const cleanResult = queuedPrompt.prompt.getCleanResult(result);

          // Only do something if the prompt is still in the queue
          if (get().promptQueue.length > 0 && get().promptQueue[0].uniqueId === queuedPrompt.uniqueId) {
            get().setLastGptMessage(cleanResult);
          } else {
            cancelled = true;
            break;
          }
        }
        if (!cancelled) {
          logEvent("RESULT_FROM_GPT", { uniqueId: queuedPrompt.uniqueId, streamed: true, firstResultTimestamp: firstResultTimestamp, nbChunks: nbChunks, resultBeforeClean: result, cleanResult: queuedPrompt.prompt.getCleanResult(result) });
        }
      } else {
        const cleanResult = queuedPrompt.prompt.getCleanResult(readStream.choices[0]?.message.content || '');

        if (get().promptQueue.length > 0 && get().promptQueue[0].uniqueId === queuedPrompt.uniqueId) {
          addMessage();
          logEvent("RESULT_FROM_GPT", { uniqueId: queuedPrompt.uniqueId, streamed: false, resultBeforeClean: readStream.choices[0]?.message.content || '', cleanResult: cleanResult });
          get().setLastGptMessage(queuedPrompt.prompt.getCleanResult(readStream.choices[0]?.message.content || ''));
        }
      }
    }

    if (get().type === "unknown") {
      const detectedType = (queuedPrompt.prompt as UnknownPrompt).detectedType;
      set((state) => ({ type:  detectedType}));
    }

    if (queuedPrompt.doneCallback && get().promptQueue.length > 0 && get().promptQueue[0].uniqueId === queuedPrompt.uniqueId) queuedPrompt.doneCallback();

    // Remove the prompt from the queue
    set((state) => ({ 
      promptQueue: [...state.promptQueue.filter((p) => p.uniqueId !== queuedPrompt.uniqueId)],
      loadingElements: [],
    }));

    // If there are more prompts in the queue, execute the next one
    if (get().promptQueue.length > 0) {
      const nextPrompt = get().promptQueue[0];
      console.log("Executing next prompt", nextPrompt)
      get()._executeQueuedPrompt(nextPrompt);
    }
  },

  isLoading: () => get().promptQueue.length > 0,

  clearPromptQueue: () => set((state) => ({ promptQueue: [], loadingElements: [] })),

  setOpenAIKey: (key) => {
    openai.apiKey = key;
  },

  getOpenAIKey: () => {
    return openai.apiKey;
  },

  setGptModel: (model) => {
    gptModel = model;
  },

  getGptModel: () => {
    return gptModel
  },

  setHistory: (history) => set((state) => ({ history: history })),

  executePrompt: async (promptObject: ComplexPrompt, doneCallback = () => { }, addToConversation = false, useChatGptSystemPrompt = false, stream = true, streamStartCallback = () => { }) => {
    // Add to prompt queue    
    const uniqueId = Math.round(Math.random() * 100000);
    const logEvent = useStudyModelStore.getState().logEvent;
    logEvent("PROMPT_ADDED_TO_QUEUE", { uniqueId: uniqueId, promptObject: promptObject, addToConversation: addToConversation, useChatGptSystemPrompt: useChatGptSystemPrompt, stream: stream });

    const queuedPrompt = { uniqueId: uniqueId, prompt: promptObject, doneCallback: doneCallback, addToConversation: addToConversation, useChatGptSystemPrompt: useChatGptSystemPrompt, stream: stream, streamStartCallback: streamStartCallback };
    set((state) => ({ promptQueue: [...state.promptQueue, queuedPrompt] }));

    // If there is already a prompt being executed, do nothing. We'll have to wait for the current prompt to finish
    if (get().promptQueue.length > 1) return;

    // Execute the prompt
    get()._executeQueuedPrompt(queuedPrompt);
  }
}))