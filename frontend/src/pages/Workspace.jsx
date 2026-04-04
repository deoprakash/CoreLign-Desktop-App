import React from 'react'
import UploadPanel from '../components/UploadPanel'
import QueryPanel from '../components/QueryPanel'
import PageTransition from '../components/PageTransition'
import ScrollReveal from '../components/ScrollReveal'

export default function Workspace() {
  return (
    <PageTransition>
      <section className="grid gap-6 lg:items-start lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <ScrollReveal direction="left" className="lg:sticky lg:top-8">
          <UploadPanel />
        </ScrollReveal>
        <ScrollReveal direction="right" className="min-w-0">
          <QueryPanel />
        </ScrollReveal>
      </section>
    </PageTransition>
  )
}
