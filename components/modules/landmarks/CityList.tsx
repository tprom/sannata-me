type Props = {
  title?: string;
  subtitle?: string;
  description: string;
  note?: string;
  highlights?: string[];
};

// UI v2.5: зона основного текста города.
export default function CityList({
  title,
  subtitle,
  description,
  note,
  highlights = [],
}: Props) {
  return (
    <section className="city-zone-2">
      <div className="city-zone-2-header">
        {title && <h2>{title}</h2>}
        {subtitle && <p className="city-zone-2-subtitle">{subtitle}</p>}
      </div>

      <p className="city-zone-2-description">{description}</p>

      {highlights.length > 0 && (
        <ul className="city-zone-2-highlights">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {note && <p className="city-zone-2-note">{note}</p>}
    </section>
  );
}
