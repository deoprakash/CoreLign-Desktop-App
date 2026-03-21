import React from 'react'
import PageTransition from '../components/PageTransition'
import ScrollReveal, { ScrollRevealGroup } from '../components/ScrollReveal'
import deo from '../assets/deo.jpg'
import arya from '../assets/arya.jpeg'
import hod from '../assets/hod.jpeg'

export default function AboutUs() {
  return (
    <PageTransition>
      <ScrollReveal className="glass rounded-3xl p-8" direction="up">
        <h1 className="font-display text-6xl font-semibold text-slate-900 text-center">Corelign</h1>
        <h3 className="font-display mt-4 text-2xl font-ligh text-slate-700 text-center">Transform Documents into Intelligent, Searchable Knowledge</h3>

        <p className="mt-4 text-slate-600 text-justify">Corelign is an advanced AI-powered document intelligence platform designed to help individuals and organizations unlock the full value of their documents. Instead of manually searching through lengthy PDFs or Word files, Corelign enables users to instantly find accurate, context-aware answers using natural language queries—just like interacting with an intelligent assistant.</p>

        <p className="mt-4 text-slate-600 text-justify">By uploading documents, Corelign automatically processes, structures, and indexes the content into a unified knowledge base. Every response is concise and relevant, and is backed by source citations for transparency and verifiability.</p>

        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-slate-800">What Corelign Is</h3>
          <p className="text-sm text-slate-600 text-justify">More than a search tool — Corelign is a context-aware knowledge system that converts unstructured files into structured intelligence. It combines modern AI techniques with robust engineering to deliver answers that are meaningful and reliable, while ensuring that users can trace every response back to its source.</p>

          <h3 className="font-semibold text-slate-800">What Corelign Does</h3>
          <ul className="list-inside list-disc text-sm text-slate-600 space-y-1 text-justify">
            <li><strong>Intelligent Document Ingestion:</strong> Upload PDFs and DOCX via UI or API; Corelign extracts text, normalizes formats, and standardizes documents for processing.</li>
            <li><strong>Semantic Structuring & Chunking:</strong> Breaks documents into meaningful sections and paragraphs, retaining page numbers and offsets for precise traceability.</li>
            <li><strong>Context Enrichment & Indexing:</strong> Enriches segments with metadata and computes vector embeddings; stores them in a high-performance vector database for fast retrieval.</li>
            <li><strong>Retrieval-Augmented Answering (RAG):</strong> Retrieves relevant segments and uses a reasoning pipeline to generate context-aware answers grounded in source material.</li>
            <li><strong>Source-Cited Responses:</strong> Every answer includes references to original document content so users can verify information easily.</li>
          </ul>

          <h3 className="font-semibold text-slate-800">Why Corelign Matters</h3>
          <p className="text-sm text-slate-600 text-justify">In information-heavy environments, finding the right answer quickly is often more valuable than access to more data. Corelign turns static documents into interactive knowledge systems so teams can save time, reduce errors, and make better decisions with confidence.</p>

          <h3 className="font-semibold text-slate-800">Use Cases</h3>
          <p className="text-sm text-slate-600 text-justify">Customer support, legal & compliance reviews, academic research, and enterprise knowledge management — wherever accurate, auditable answers from documents are needed.</p>

          <h3 className="font-semibold text-slate-800">Built for Reliability and Scale</h3>
          <p className="text-sm text-slate-600 text-justify">Corelign emphasizes low-hallucination responses, high retrieval accuracy, scalable architecture, and secure processing — making it suitable for enterprise deployments.</p>

          <h3 className="font-semibold text-slate-800">The Corelign Vision</h3>
          <p className="text-sm text-slate-600 text-justify">Move from passive reading to active intelligence: combine explainable AI with practical system design so users get faster, smarter, and more confident decisions.</p>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-slate-900 text-center">Project Developers</h2>
          <p className="mt-2 text-sm text-slate-500 text-center">Meet the team behind this project.</p>

          <ScrollRevealGroup className="mt-6 grid gap-6 sm:grid-cols-2" stagger={0.06} direction="up">
            <div className="flex flex-col items-center text-center gap-1 rounded-2xl bg-white/80 p-6 mt-5">
              <img src={deo} alt="Deo Prakash" className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover" />
              <p className="font-semibold text-xl text-slate-900">Deo Prakash</p>
              <p className="text-s text-slate-500">Associate Software Developer</p>
              <div className="mt-2 flex items-center gap-3 text-slate-600">
                <a href="https://www.linkedin.com/in/deo-prakash-152265225" target="_blank" rel="noreferrer" aria-label="Deo LinkedIn" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0zM8 8h4.8v2.3h.1c.7-1.3 2.4-2.6 4.9-2.6C22 7.7 24 9.6 24 13.8V24h-5v-9.5c0-2.3-.8-3.8-2.7-3.8-1.5 0-2.4 1-2.8 2-0.1.2-.1.5-.1.8V24H8V8z"/></svg>
                </a>
                <a href="mailto:deoprakash364@gmail.com" aria-label="Deo Email" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.5L0 6V18a2 2 0 002 2h20a2 2 0 002-2V6l-12 7.5zM12 11L0 3h24L12 11z"/></svg>
                </a>
                <a href="https://github.com/deoprakash" target="_blank" rel="noreferrer" aria-label="Deo GitHub" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.8 5.4.8 11.7c0 5 3.3 9.2 7.9 10.7.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1 1.7.8 2.1 1.2.1-.8.4-1.4.7-1.7-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.4.1-2.9 0 0 1-.3 3.3 1.2.9-.2 1.9-.4 2.9-.4 1 0 2 .2 2.9.4 2.3-1.5 3.3-1.2 3.3-1.2.6 1.5.2 2.6.1 2.9.8.9 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6 4.6-1.5 7.9-5.7 7.9-10.7C23.2 5.4 18.3.5 12 .5z"/></svg>
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-600 text-justify">I am an AI Engineer and Software Developer specializing in the development of end-to-end artificial intelligence systems. With a B.Tech in Computer Science Engineering (Artificial Intelligence), I focus on bridging the gap between complex backend engineering and applied Machine Learning to deliver high-impact, production-grade solutions. My expertise spans building multi-agent orchestration platforms, RAG pipelines, and advanced computer vision systems. I have a proven track record of taking AI projects from initial data preparation and model development through to successful deployment and visualization. Currently, I serve as an Associate Software Developer at Grid Seven AI LLP, where I engineer automated analysis systems and modular cross-platform applications. My work has been recognized through research publications with Springer Nature and IEEE, specifically in the fields of deep learning and medical imaging.</p>
            </div>

            <div className="flex flex-col items-center text-center gap-1 rounded-2xl bg-white/80 p-6 mt-5">
              <img src={arya} alt="Arya Singh" className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover" />
              <p className="font-semibold text-xl text-slate-900">Arya Singh</p>
              <p className="text-s text-slate-500">AI Engineer</p>
              <div className="mt-2 flex items-center gap-3 text-slate-600">
                <a href="https://www.linkedin.com/in/arya-singh-3558a5256/" target="_blank" rel="noreferrer" aria-label="Arya LinkedIn" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0zM8 8h4.8v2.3h.1c.7-1.3 2.4-2.6 4.9-2.6C22 7.7 24 9.6 24 13.8V24h-5v-9.5c0-2.3-.8-3.8-2.7-3.8-1.5 0-2.4 1-2.8 2-0.1.2-.1.5-.1.8V24H8V8z"/></svg>
                </a>
                <a href="mailto:aryasingh1320@gmail.com" aria-label="Arya Email" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13.5L0 6V18a2 2 0 002 2h20a2 2 0 002-2V6l-12 7.5zM12 11L0 3h24L12 11z"/></svg>
                </a>
                <a href="https://github.com/AryaSingh-25" target="_blank" rel="noreferrer" aria-label="Arya GitHub" className="hover:text-slate-900">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.8 5.4.8 11.7c0 5 3.3 9.2 7.9 10.7.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1 1.7.8 2.1 1.2.1-.8.4-1.4.7-1.7-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.4.1-2.9 0 0 1-.3 3.3 1.2.9-.2 1.9-.4 2.9-.4 1 0 2 .2 2.9.4 2.3-1.5 3.3-1.2 3.3-1.2.6 1.5.2 2.6.1 2.9.8.9 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6 4.6-1.5 7.9-5.7 7.9-10.7C23.2 5.4 18.3.5 12 .5z"/></svg>
                </a>
              </div>
              <p className="mt-3 text-sm text-slate-600 text-justify">I am a final-year Computer Science Engineering student specializing in Artificial Intelligence, with hands-on experience in building real-world AI systems. My work spans deep learning, LLM applications, and multimodal AI, including projects in healthcare, industrial defect detection, and intelligent automation. Currently working as an AI Engineer, I focus on developing scalable solutions such as RAG pipelines, LLM-driven assistants, and edge-deployed models. I am deeply interested in research-driven innovation, aiming to build impactful systems that bridge the gap between AI theory and practical deployment.</p>
            </div>
          </ScrollRevealGroup>
          
          <h2 className="font-display text-2xl font-semibold text-slate-900 text-center mt-10">Project Guide</h2>
          <div className='flex flex-col items-center text-center gap-1 rounded-2xl bg-white/80 p-6'>
              <img src={hod} alt="HOD Sir" className='h-32 w-32 md:h-40 md:w-40 rounded-full object-cover' />
              <p className="font-semibold text-xl text-slate-900">Dr. Rudra Pratap Singh Chauhan Sir</p>
              <p className="text-s text-slate-500">Professor, Head of Department</p>
              <p className="text-s text-slate-500">Department of CSE(AI) & AIML, SSIPMT, RAIPUR (C.G)</p>
            </div>
        </div>
      </ScrollReveal>
    </PageTransition>
  )
}
