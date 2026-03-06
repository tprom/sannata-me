type Props = {
  items: string[];
};

export default function FactsSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="landmark-section">
      <h3>Факты</h3>
      <div className="landmark-facts-grid">
        {items.map((fact, index) => (
          <article key={`${fact}-${index}`} className="landmark-fact-card">
            <p>{fact}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
