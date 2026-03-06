type Props = {
  title: string;
  subtitle?: string;
  image: string;
};

export default function HeroSection({ title, subtitle, image }: Props) {
  return (
    <section className="landmark-section landmark-hero">
      {/* v2.8: hero + затемнение + title + subtitle */}
      <img className="landmark-hero-image" src={image} alt={title} />
      <div className="landmark-hero-overlay" />
      <div className="landmark-hero-content">
        <h1>{title}</h1>
        {subtitle && <p className="landmarks-muted">{subtitle}</p>}
      </div>
    </section>
  );
}
