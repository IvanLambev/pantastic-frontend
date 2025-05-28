import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQ() {
  const faqs = [
    {
      question: "Do you offer vegan or gluten-free pancakes?",
      answer: "Yes, we have both vegan and gluten-free options clearly labeled on the menu.",
    },
    {
      question: "Can I schedule an order in advance?",
      answer: "Yes, during checkout you can select a preferred delivery or pickup time.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept credit cards, Apple Pay, Google Pay, and cash on pickup.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can reach us via email at support@yourpancakesite.com or by calling us directly at [insert phone number].",
    },
  ]

  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-orange-200 rounded-lg px-6 data-[state=open]:border-orange-300"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-orange-600 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
