import './App.css';
import TextualEntity from './view/entities/TextualEntity';
import SVGEntity from './view/entities/SVGEntity';
import CodeEntity from './view/entities/CodeEntity';
import { RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom';
import { useModelStore } from './model/Model';
import DirectInterface from './view/DirectInterface';
import ChatInterface from './view/ChatInterface';
import StudyInterface from './view/study/StudyInterface';
import UnknownEntity from './view/entities/UnknownEntity';
import Launcher from './view/Launcher';


function App() {
  const setLastGptMessage = useModelStore((state) => state.setLastGptMessage);
  const setType = useModelStore((state) => state.setType);


  const router = createHashRouter([
    {
      path: '/svg',
      loader: () => {
        setLastGptMessage(`<svg width="300" height="150">
  <circle cx="133" cy="33" r="15"/>
  <circle cx="151" cy="20" r="15"/>
  <circle cx="163" cy="56" r="15"/>
  <circle cx="140" cy="56" r="15"/>
  <circle cx="171" cy="33" r="15"/>
  <circle cx="151" cy="41" fill="white" r="12"/>
</svg>`);
        setType('svg');
        return null;
      },
      element: <DirectInterface><SVGEntity/></DirectInterface>
    },

    {
      path: '/text',
      loader: () => {
        setLastGptMessage(
`Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so _very_ remarkable in that; nor did Alice think it so _very_ much out of the way to hear the Rabbit say to itself, “Oh dear! Oh dear! I shall be late!” (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually _took a watch out of its waistcoat-pocket_, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.`
          );
        setType('text');
        return null;
      },
      element: <DirectInterface><TextualEntity/></DirectInterface>
    },

    {
      path: '/code',
      loader: () => {
        setLastGptMessage(
`function countValuesBelowMean(data, windowSize) {
  for (let i = 0; i < data.length; i++) {
    const startIndex = Math.max(0, i - windowSize + 1);
    const windowData = data.slice(startIndex, i + 1);

    let windowSum = 0;
    for (const i of windowData) {
      windowSum += i;
    }

    let countBelowMean = 0;
    for (const i of windowData) {
      if (i < windowSum / windowData.length) {
        countBelowMean++;
      }
    }

    console.log(countBelowMean);
  }
}`
        );
        setType('code');
        return null;
      },
      element: <DirectInterface><CodeEntity/></DirectInterface>
    },


    {
      path: '/clean',
      loader: () => {
        setLastGptMessage(``);
        setType('unknown');
        return null;
      },
      element: <DirectInterface><UnknownEntity/></DirectInterface>
    },

    {
      path: '/chat',
      loader: () => {
        setLastGptMessage(
`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
//`Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.”
);
        setType('text');
        setLastGptMessage(`
\`\`\`html
<svg height="210" width="400">
  <path d="M150 0 L75 200 L225 200 Z" />
</svg>
\`\`\`
`);
        setType('svg');
        return null;
      },
      element: <ChatInterface></ChatInterface>
    },

    {
      path: '/study',
      loader: () => {
        return null;
      },
      element: <StudyInterface/>
    },

    {
      path: '/',
      loader: () => {
        return null;
      },
      element: <Launcher/>
    },

  ],
  {
    basename: "/DirectGPT"
  }
  );

  return (
    <RouterProvider router={router} />
  );
}

export default App;
