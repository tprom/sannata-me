type Props = {
  legend: string;
};

export default function MiniLegendSection({ legend }: Props) {
  if (!legend) return null;

  return (
    <section className="landmark-section">
      <details className="landmark-legend">
        <summary>Легенда</summary>
        <p>{legend}</p>
      </details>
    </section>
  );
}
