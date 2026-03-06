type Props = {
  teaser?: string;
};

export default function TeaserSection({ teaser }: Props) {
  return (
    <section className="landmark-section">
      <h3>Коротко</h3>
      {teaser ? (
        <p className="landmark-teaser">{teaser}</p>
      ) : (
        <div className="landmark-teaser landmark-skeleton" aria-label="Загрузка" />
      )}
    </section>
  );
}
