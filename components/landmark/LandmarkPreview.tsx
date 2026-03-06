type Props = {
  title: string;
  shortDescription: string;
  image: string;
};

export default function LandmarkPreview({ title, shortDescription, image }: Props) {
  return (
    <div className="landmark-preview">
      {/* v2.7: карточка превью для меню достопримечательностей */}
      <img src={image} alt={title} className="landmark-preview-image" />
      <h4>{title}</h4>
      <p className="landmark-preview-muted">{shortDescription}</p>
    </div>
  );
}
