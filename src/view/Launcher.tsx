import React, { useState } from "react";
import { useModelStore } from '../model/Model';
import { useStudyModelStore } from "./study/StudyModel";
import GithubCorner from "react-github-corner";

export default function Launcher(props: { children: React.ReactNode, leftSide?: React.ReactNode }) {
  const [accessKey, setAccessKey] = useState('');
  const [gptModel, setStoredGptModel] = useState('gpt-4-1106-preview');
  const setGptModel = useModelStore((state) => state.setGptModel);
  const setOpenAIKey = useModelStore((state) => state.setOpenAIKey);
  const resetModel = useModelStore((state) => state.reset);
  const resetStudyModel = useStudyModelStore((state) => state.reset);


  // Three big buttons to start text, code and image
  return <div className="short-pulse" style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
    <GithubCorner href="https://github.com/m-damien/DirectGPT"/>
    <h1>OpenAI API key</h1>
    <span style={{ fontSize: 25 }}>To run the examples below, please paste an OpenAI API key. You can obtain one from <a href="https://platform.openai.com/account/api-keys">here</a>.</span>
    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30}}>
      <input style={{ width: 400, marginTop: 10, height: 50, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} type="text" placeholder="sk-...." onChange={
        (event) => {
          // set open ai key
          setAccessKey(event.target.value);
          setOpenAIKey(event.target.value);
        }
      } />
      {/* Choice box to choose the model to use */}
      <select id="modelSelectBox" value={gptModel} style={{ width: 200, height: 50, marginTop: 10, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onChange={
        (event) => {
          // set open ai key
          setStoredGptModel(event.target.value);
          setGptModel(event.target.value);
        }
      }
      >
        <option value="gpt-4-1106-preview">gpt-4-turbo</option>
        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
      </select>
    </div>




    <div style={{ height: 50 }} />
    <h1 style={{ color: accessKey.length === 0 ? "gray" : 'black' }}>Shortcuts to try out DirectGPT on examples</h1>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
      <button disabled={accessKey.length === 0} style={{ width: 200, height: 200, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onClick={() => {
        resetModel()
        resetStudyModel()
        window.location.hash = '/text' + `?k=${btoa(accessKey)}&m=${btoa(gptModel)}`;
      }}>
        <div style={{ flexDirection: 'column', height: '80%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <img src={process.env.PUBLIC_URL + '/study/T1_synonyms.png'} style={{ width: 150 }} />
          Text
        </div>
      </button>
      <button disabled={accessKey.length === 0} style={{ width: 200, height: 200, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onClick={() => {
        resetModel()
        resetStudyModel()
        window.location.hash = '/code' + `?k=${btoa(accessKey)}&m=${btoa(gptModel)}`;
      }}>
        <div style={{ flexDirection: 'column', height: '80%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <img src={process.env.PUBLIC_URL + '/study/C2_refactor.png'} style={{ width: 120 }} />
          Code
        </div>
      </button>
      <button disabled={accessKey.length === 0} style={{ width: 200, height: 200, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onClick={() => {
        resetModel()
        resetStudyModel()
        window.location.hash = '/svg' + `?k=${btoa(accessKey)}&m=${btoa(gptModel)}`;
      }}>
        <div style={{ flexDirection: 'column', height: '80%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
          <img src={process.env.PUBLIC_URL + '/study/S1_colorize.png'} style={{ width: 150 }} />
          Image
        </div>
      </button>
      <button disabled={accessKey.length === 0} style={{ width: 200, height: 200, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onClick={() => {
        resetModel()
        resetStudyModel()
        window.location.hash = '/clean' + `?k=${btoa(accessKey)}&m=${btoa(gptModel)}`;
      }}>From Scratch</button>
    </div>
    <div style={{ height: 50 }} />

    <h1 style={{ color: accessKey.length === 0 ? "gray" : 'black' }}>Run the study</h1>
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
      {/* Add a combobox to choose the participant id and a button to start the study */}
      <h2 style={{ color: accessKey.length === 0 ? "gray" : 'black' }}>Participant ID: </h2>
      <select id="participantIdSelectBox" disabled={accessKey.length === 0} style={{ width: 200, height: 50, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }}>
        <option value="0">P0</option>
        <option value="1">P1</option>
        <option value="2">P2</option>
        <option value="3">P3</option>
        <option value="4">P4</option>
        <option value="5">P5</option>
        <option value="6">P6</option>
        <option value="7">P7</option>
        <option value="8">P8</option>
        <option value="9">P9</option>
        <option value="10">P10</option>
        <option value="11">P11</option>
      </select>
      {/* Checkbox to enable/disable saving the data */}
      <h2 style={{ color: accessKey.length === 0 ? "gray" : 'black' }}>Save Data: </h2>
      <input type="checkbox" id="saveDataCheckbox" disabled={accessKey.length === 0} style={{ width: 20, height: 20, borderRadius: 5 }} />
      {/* Button to start the study */}
      <button disabled={accessKey.length === 0} style={{ width: 200, height: 50, borderRadius: 5, fontSize: 20, fontWeight: 'bold' }} onClick={() => {
        resetModel()
        resetStudyModel()
        window.location.hash = '/study' + '?pid=' + (document.getElementById("participantIdSelectBox") as HTMLSelectElement).value + `&k=${btoa(accessKey)}&m=${btoa(gptModel)}&dataSaved=${(document.getElementById("saveDataCheckbox") as HTMLInputElement).checked}`;
      }}>Start</button>

    </div>
  </div>
}
