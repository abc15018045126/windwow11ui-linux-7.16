import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  ChatMessage,
  AppComponentProps,
  AppDefinition,
} from '../../window/types';
import {generateGeminiResponse} from '../../services/geminiService';
import {SearchIcon, GeminiIcon} from '../../window/constants';

const GeminiChatApp: React.FC<AppComponentProps> = ({
  appInstanceId,
  setTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(`Gemini Chat - ${appInstanceId.substring(0, 4)}`);
  }, [appInstanceId, setTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const loadingBotMessageId = (Date.now() + 1).toString();
    const loadingBotMessage: ChatMessage = {
      id: loadingBotMessageId,
      sender: 'bot',
      text: 'Thinking...',
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingBotMessage]);

    try {
      const responseText = await generateGeminiResponse(userMessage.text);
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        text: responseText,
      };
      setMessages(prev =>
        prev.map(msg => (msg.id === loadingBotMessageId ? botMessage : msg)),
      );
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        text: "Sorry, I couldn't get a response.",
      };
      setMessages(prev =>
        prev.map(msg => (msg.id === loadingBotMessageId ? errorMessage : msg)),
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <div className="flex flex-col h-full p-4 bg-black text-sm">
      <div className="flex-grow overflow-y-auto mb-4 custom-scrollbar pr-2 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] p-2.5 rounded-lg shadow ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-zinc-900 text-zinc-200 rounded-bl-none'
              } ${msg.isLoading ? 'italic animate-pulse' : ''}`}
            >
              {/* Basic Markdown-like newlines */}
              {msg.text.split('\n').map((line, index) => (
                <span key={index}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center border-t border-zinc-800 pt-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e =>
            e.key === 'Enter' && !isLoading && handleSendMessage()
          }
          placeholder="Ask Gemini anything..."
          className="flex-grow bg-zinc-900 border border-zinc-700 rounded-l-md py-2 px-3 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-zinc-400"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white px-4 py-2 rounded-r-md flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <SearchIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export const appDefinition: AppDefinition = {
  id: 'geminiChat',
  name: 'Gemini Chat',
  icon: 'geminiChat',
  component: GeminiChatApp,
  defaultSize: {width: 500, height: 700},
  isPinnedToTaskbar: true,
};

export default GeminiChatApp;
