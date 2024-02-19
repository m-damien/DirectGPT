import React, { useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'react-tabs/style/react-tabs.css';
import { MessageGPT, useModelStore } from '../model/Model';
import { ChatPrompt } from "../model/prompts/ChatPrompt";
import PromptBuilder from './components/PromptBuilder';

function ChatMessage(props: { message: MessageGPT }) {
  return <div style={{
    textAlign: 'left',
    background: props.message.role === "user" ? "rgb(247, 247, 248)" : "none",
    lineHeight: '1.5rem',
    maxWidth: 600,
    width: '100%',
    borderBottom: '1px solid #d9d9e3',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
  }}>
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const childrenStr = String(children).trim();
          const match = /language-(\w+)/.exec(className || '')

          if (!inline && match) {
            const code = <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              style={tomorrow}
              language={match[1]}
              PreTag="div"
            />
            if (childrenStr.startsWith('<svg')/* && childrenStr.endsWith("</svg>")*/) {
              return                   <div
              style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px', width: 'fit-content' }}
              key={match.index}
              dangerouslySetInnerHTML={{ __html: childrenStr }}></div>
            } else {
              return code;
            }
          }
          return <code {...props} className={className}>
            {children}
          </code>
        }
      }}
    >{props.message.content}</ReactMarkdown>
  </div>
}

export default function ChatInterface(props: { leftSide?: React.ReactNode }) {
  const executePrompt = useModelStore((state) => state.executePrompt);
  const type = useModelStore((state) => state.type);
  const gptMessages = useModelStore((state) => state.gptMessages);
  const messageScrollpaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageScrollpaneRef.current) {
      // Scroll to the bottom because a message might have been added
      messageScrollpaneRef.current.scrollTop = messageScrollpaneRef.current.scrollHeight;
    }
  }, [gptMessages]);

  return <div className="App">
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'row', justifyContent: 'center' }}>
      <div style={{ flexGrow: 1 }}>{props.leftSide}</div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 5, maxWidth: 700 }}>
        <div style={{ overflowY: 'scroll' }} ref={messageScrollpaneRef}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {gptMessages.map((m, i) => (<ChatMessage key={i} message={m} />))}
          </div>
        </div>


        <div style={{ width: '100%', padding: 10 }}>
          <PromptBuilder
            id="main-prompt-builder"
            draggable={false}
            onSendCallback={(prompt, stopLoading) => {
              const complexPrompt = new ChatPrompt(prompt);
              executePrompt(complexPrompt, () => {
                stopLoading()
              }, true, true);
            }}></PromptBuilder>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }}></div>

    </div>

  </div>
}
