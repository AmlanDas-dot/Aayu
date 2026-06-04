export const OLLAMA_CONFIG = {
  baseUrl: "http://localhost:11434",
  model: "llama3.1:8b",
  endpoints: {
    generate: "/api/generate",
  },
  defaultOptions: {
    stream: false,
  },
};
