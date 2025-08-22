import {GoogleGenAI, GenerateContentResponse} from '@google/genai';

const API_URL = 'http://localhost:3001/api';

let ai: GoogleGenAI | null = null;
let isInitializing = false;

// Gets the API key by fetching from the backend server
const getApiKey = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/get-key`);
    if (!response.ok) {
      throw new Error(`Failed to fetch API key: ${response.statusText}`);
    }
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error('Could not fetch Gemini API key from the backend:', error);
    return null;
  }
};

// Initialize the GoogleGenAI instance asynchronously
const initializeAi = async () => {
  if (ai || isInitializing) return;
  isInitializing = true;

  try {
    const apiKey = await getApiKey();
    if (apiKey) {
      ai = new GoogleGenAI({apiKey});
    } else {
      console.warn(
        'Gemini API key not found. Ensure the backend server is running and the API_KEY is set in the .env file. AI features will be disabled or return mock responses.',
      );
    }
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
  } finally {
    isInitializing = false;
  }
};

export const generateGeminiResponse = async (
  prompt: string,
): Promise<string> => {
  // Ensure the AI client is initialized before making a request
  if (!ai && !isInitializing) {
    await initializeAi();
  }

  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return 'Gemini API is not configured. Please ensure the backend server is running and the API_KEY environment variable is set.';
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      return `Error from Gemini: ${error.message}`;
    }
    return 'An unknown error occurred while contacting Gemini.';
  }
};
