import UniversalSectionsRenderer from "@/components/modules/landmarks/UniversalSectionsRenderer";
import type { UniversalPageEnvelope } from "@/lib/universal-page-template/types";

type Props = {
  envelope: UniversalPageEnvelope;
  heroDescription?: string;
};

export default function CollectionSectionsRenderer({
  envelope,
  heroDescription,
}: Props) {
  const hero = envelope.hero;

  return (
    <>
      <section className="city-zone-1">
        {hero?.image && (
          <img
            className="city-hero"
            src={hero.image}
            alt={hero.title || envelope.meta.title}
          />
        )}
        <h1>{hero?.title || envelope.meta.title}</h1>
        <h2 className="landmarks-muted">
          {hero?.subtitle || envelope.meta.subtitle}
        </h2>
        {heroDescription && (
          <p className="landmarks-muted">{heroDescription}</p>
        )}
      </section>

      <UniversalSectionsRenderer envelope={envelope} />
    </>
  );
}
