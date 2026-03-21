export const features = [
  {
    title: 'Smart Ingestion',
    description: 'Drop DOCX or PDF files, auto-detect structure, and map sections into semantic chunks.',
  },
  {
    title: 'High-Recall Retrieval',
    description: 'FAISS-powered search surfaces the most relevant context in milliseconds.',
  },
  {
    title: 'Grounded Answers',
    description: 'Groq responses are anchored to your sources with traceable citations.',
  },
]

export const steps = [
  { label: 'Upload', detail: 'DOCX & PDF ingestion' },
  { label: 'Chunk', detail: 'Semantic sectioning' },
  { label: 'Search', detail: 'Vector similarity' },
  { label: 'Answer', detail: 'LLM with citations' },
]

export const stats = [
  { label: 'Avg. Query', value: '480ms' },
  { label: 'Docs Indexed', value: '12.4k' },
  { label: 'Chunk Recall', value: '94%' },
]
