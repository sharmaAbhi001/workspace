import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion"

const faqs = [
  {
    question: "Does it send emails automatically?",
    answer:
      "No. Workspace drafts replies for you, but nothing is sent until you approve.",
  },
  {
    question: "Which email providers are supported?",
    answer: "Gmail is supported now. Outlook support is planned.",
  },
  {
    question: "Can I connect more than one account?",
    answer: "Yes. You can connect multiple Gmail accounts.",
  },
  {
    question: "What happens to my data if I disconnect?",
    answer:
      "You can disconnect Gmail anytime. After disconnect, Workspace stops accessing that account.",
  },
  {
    question: "Which documents can I upload?",
    answer:
      "Business documents such as pricing sheets, FAQs, and policies — so replies use your information.",
  },
  {
    question: "How much does Workspace cost?",
    answer: "Pricing coming soon.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
          <p className="mt-3 text-muted-foreground">
            Common questions about Workspace.
          </p>
        </div>
        <Accordion multiple={false}>
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
