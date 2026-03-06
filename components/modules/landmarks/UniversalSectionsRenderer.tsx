import Link from "next/link";
import type {
  UniversalPageEnvelope,
  UniversalSection,
} from "@/lib/universal-page-template/types";

type Props = {
  envelope: UniversalPageEnvelope;
};

export default function UniversalSectionsRenderer({ envelope }: Props) {
  return (
    <>
      {envelope.sections
        .filter((section) => section.visible)
        .map((section) => (
          <SectionView key={section.id} section={section} />
        ))}
    </>
  );
}

function SectionView({ section }: { section: UniversalSection }) {
  if (section.payload.kind === "summary") {
    return (
      <section className="city-zone-2">
        <div className="city-zone-2-header">
          {section.payload.title && <h2>{section.payload.title}</h2>}
          {section.payload.subtitle && (
            <p className="city-zone-2-subtitle">{section.payload.subtitle}</p>
          )}
        </div>
        <p className="city-zone-2-description">{section.payload.description}</p>
      </section>
    );
  }

  if (section.payload.kind === "highlights") {
    if (section.payload.items.length === 0) return null;
    return (
      <section className="city-zone-2">
        <ul className="city-zone-2-highlights">
          {section.payload.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (section.payload.kind === "cta") {
    return (
      <section className="city-zone-2">
        <p className="city-zone-2-note">{section.payload.text}</p>
      </section>
    );
  }

  if (section.payload.kind === "links-grid") {
    return (
      <section className="city-zone-3">
        <h3>{section.payload.title}</h3>
        <div className="city-landmarks-gallery">
          {section.payload.items.map((item) => (
            <Link key={item.id} className="landmark-card" href={item.href}>
              {item.image && (
                <div className="landmark-card-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="landmark-card-image"
                  />
                </div>
              )}

              <div className="landmark-card-content">
                <h4>{item.title}</h4>
                {item.description && (
                  <p className="landmark-card-muted">{item.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return null;
}
