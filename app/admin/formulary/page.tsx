const formulary = [
  { generic: "Paracetamol", brands: ["PCM", "Crocin"], shorthand: ["PCM", "T. PCM"] },
  { generic: "Levocetirizine", brands: ["Levocet"], shorthand: ["Levocet"] },
  { generic: "Amoxicillin", brands: ["Amoxil"], shorthand: ["Amox"] }
];

export default function FormularyPage() {
  return (
    <main className="py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Formulary</h1>
        <div className="mt-6 space-y-4">
          {formulary.map((drug) => (
            <article key={drug.generic} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{drug.generic}</h2>
              <p className="mt-2 text-slate-700">Brands: {drug.brands.join(", ")}</p>
              <p className="text-slate-700">Shorthand: {drug.shorthand.join(", ")}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
