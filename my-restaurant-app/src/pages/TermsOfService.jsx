import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function TermsOfService() {
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch('/TERMS_OF_SERVICE.md')
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => console.error('Error loading terms of service:', error))
  }, [])

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
