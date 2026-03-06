type Props = {
  citySlug: string;
  slug: string;
  title: string;
  shortDescription: string;
  image: string;
};

// Карточка достопримечательности (v2.6).
export default function LandmarkCard({
  citySlug,
  slug,
  title,
  shortDescription,
  image,
}: Props) {
  const hasImage = typeof image === "string" && image.trim().length > 0;
  return (
    <a href={`/landmark/${citySlug}/${slug}`} className="landmark-card">
      {hasImage && (
        <div className="landmark-card-image-wrapper">
          <img src={image} alt={title} className="landmark-card-image" />
        </div>
      )}

      <div className="landmark-card-content">
        <h4>{title}</h4>
        <p className="landmark-card-muted">{shortDescription}</p>
      </div>
    </a>
  );
}