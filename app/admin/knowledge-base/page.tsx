import { knowledgeBaseArticles } from "@/lib/knowledge-base";

export default function KnowledgeBasePage() {
  return (
    <main className="py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Knowledge base</h1>
        <div className="mt-6 space-y-4">
          {knowledgeBaseArticles.map((article) => (
            <article key={article.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{article.question}</h2>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {article.category}
                </span>
              </div>
              <p className="mt-3 text-slate-700">{article.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
