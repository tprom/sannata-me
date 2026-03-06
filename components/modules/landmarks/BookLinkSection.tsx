import Link from "next/link";

type Props = {
  lang?: string;
};

export default function BookLinkSection({ lang }: Props) {
  const prefix = lang ? `/${lang}` : "";
  const href = `${prefix}/books/ketty-landsberg-journey/read`;

  return (
    <section className="landmark-section">
      <Link className="landmark-book-button" href={href}>
        Читать полную историю в книге Кетти
      </Link>
    </section>
  );
}
