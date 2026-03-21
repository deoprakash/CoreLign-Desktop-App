import React from 'react'
import PageTransition from '../components/PageTransition'
import ScrollReveal from '../components/ScrollReveal'

export default function ContactUs() {
  return (
    <PageTransition>
      <ScrollReveal className="glass rounded-3xl p-8" direction="up">
        <h1 className="font-display text-3xl font-semibold text-slate-900">Contact Us</h1>
        <p className="mt-4 text-slate-600">Have questions or want a demo? Reach out and we will get back to you promptly.</p>

        <div className="mt-6 max-w-md">
          <p className="text-sm text-slate-600">Email: sales@corelign.example</p>
          <p className="mt-2 text-sm text-slate-600">Phone: +1 (555) 123-4567</p>
        </div>
      </ScrollReveal>
    </PageTransition>
  )
}
