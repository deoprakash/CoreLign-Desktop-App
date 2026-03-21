import React from 'react'
import UploadPanel from '../components/UploadPanel'
import QueryPanel from '../components/QueryPanel'
import PageTransition from '../components/PageTransition'
import ScrollReveal from '../components/ScrollReveal'

export default function Workspace() {
  return (
    <PageTransition>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ScrollReveal direction="left">
          <UploadPanel />
        </ScrollReveal>
        <ScrollReveal direction="right">
          <QueryPanel />
        </ScrollReveal>
      </section>
    </PageTransition>
  )
}
