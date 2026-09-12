export type KnowledgeBaseArticle = {
  id: string;
  question: string;
  answer: string;
  category: string;
  updatedBy: string;
  updatedAt: string;
  active: boolean;
};

export const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "clinic-hours",
    question: "What are the clinic hours?",
    answer: "The clinic is open from 9:00 AM to 7:00 PM Monday to Saturday.",
    category: "timing",
    updatedBy: "admin",
    updatedAt: "2026-09-12",
    active: true
  },
  {
    id: "consultation-fee",
    question: "What is the consultation fee?",
    answer: "The standard consultation fee is ₹500 for a regular visit, with specialist rates applied as needed.",
    category: "fees",
    updatedBy: "admin",
    updatedAt: "2026-09-12",
    active: true
  }
];

export function getKnowledgeBaseAnswer(question: string): string {
  const match = knowledgeBaseArticles.find((article) => article.question.toLowerCase().includes(question.toLowerCase()));
  return match ? match.answer : "I am not confident about that answer. Please talk to a person.";
}
