import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TermsOfService() {
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch('/TERMS_OF_SERVICE.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => console.error('Error loading terms of service:', error))
  }, [])

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-md border p-6 md:p-8">
        <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-primary prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-table:text-sm">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </ScrollArea>
    </div>
  )
}
