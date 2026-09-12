import { classifyChatIntent, containsEmergencyTerms, stripIdentifiers } from "@/lib/security/deidentify";

export type FAQArticle = {
  id: string;
  title: string;
  question: string;
  answer: string;
  category: string;
};

const faqArticles: FAQArticle[] = [
  {
    id: "faq-hours",
    title: "Clinic hours",
    question: "What are the clinic timings?",
    answer: "The clinic is open from 9:00 AM to 7:00 PM, Monday to Saturday.",
    category: "timing"
  },
  {
    id: "faq-fee",
    title: "Consultation fee",
    question: "What is the consultation fee?",
    answer: "The standard consultation fee is ₹500 for a regular visit.",
    category: "fee"
  },
  {
    id: "faq-what-to-bring",
    title: "What to bring",
    question: "What should I bring for my appointment?",
    answer: "Please bring your ID, prior reports, a list of medicines, and your appointment confirmation.",
    category: "prep"
  }
];

export function getRelevantFaqArticles(userQuestion: string): FAQArticle[] {
  const q = userQuestion.toLowerCase();
  return faqArticles.filter((article) => {
    const haystack = `${article.title} ${article.question} ${article.answer}`.toLowerCase();
    return haystack.includes(q) || q.includes(article.category) || q.includes("clinic") || q.includes("appointment");
  });
}

export function buildEmergencyReply(): string {
  return "This is an emergency. Please call emergency services now or go to the nearest emergency department. If you are in the clinic area, call the clinic emergency number immediately and do not wait for the chatbot."
}

export function buildFaqReply(userQuestion: string): string {
  const { sanitized } = stripIdentifiers(userQuestion);
  const candidateArticles = getRelevantFaqArticles(sanitized);

  if (!candidateArticles.length) {
    return "I do not have a clear answer for that. Please choose 'Talk to a person' and our clinic staff will help you.";
  }

  return candidateArticles.map((article) => `${article.title}: ${article.answer}`).join("\n");
}

export function shouldRejectMedicalAdvice(message: string): boolean {
  const text = message.toLowerCase();
  const advicePatterns = /(diagnosis|treatment|medicine|dose|side effect|test report|lab report|medication|prescription)/i;
  return advicePatterns.test(text) || containsEmergencyTerms(message);
}

export function generateChatReply(message: string): { type: "emergency" | "faq" | "refuse"; text: string; intent: string } {
  const sanitizedMessage = stripIdentifiers(message).sanitized;
  const intent = classifyChatIntent(sanitizedMessage);

  if (containsEmergencyTerms(sanitizedMessage)) {
    return { type: "emergency", text: buildEmergencyReply(), intent };
  }

  if (shouldRejectMedicalAdvice(sanitizedMessage)) {
    return {
      type: "refuse",
      text: "I can answer clinic logistics and appointment questions, but I cannot provide medical advice, diagnosis, or treatment guidance. If you need clinical help, please contact the clinic or speak with a staff member.",
      intent
    };
  }

  return { type: "faq", text: buildFaqReply(sanitizedMessage), intent };
}
