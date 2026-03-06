import LandmarkGallery from "./LandmarkGallery";

type Props = {
  images: string[];
};

export default function GallerySection({ images }: Props) {
  return (
    <section className="landmark-section landmark-gallery-section">
      {/* v2.8: используем существующую галерею */}
      <LandmarkGallery images={images} />
    </section>
  );
}
