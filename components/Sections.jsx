// components/Sections.jsx
export default function Sections({ t }) {
  return (
    <main>
      {/* 1. Врата */}
      <section id="varta">
        <h1>{t.title}</h1>
        <h2>{t.subtitle}</h2>
        <p className="intro">{t.intro}</p>
        <a href="#legend" className="btn-enter">{t.enter}</a>
      </section>

      {/* 2. Легенда */}
      <section id="legend">
        <h2>{t.legend_title}</h2>
        <p>{t.legend_p1}</p>
        <p>{t.legend_p2}</p>
        <p>{t.legend_p3}</p>
      </section>

      {/* 3. Тишина и творчество */}
      <section id="creativity">
        <h2>{t.creativity_title}</h2>
        <p>{t.creativity_p1}</p>
        <p>{t.creativity_p2}</p>
        <p><strong>{t.creativity_p3}</strong></p>
      </section>

      {/* 4. Образы */}
      <section id="images">
        <h2>{t.images_title}</h2>
        <p>{t.images_p1}</p>
        <div className="gallery">
          <figure>
            <img src="/images/image1.jpg" alt={t.img1} />
            <figcaption>{t.img1}</figcaption>
          </figure>
          <figure>
            <img src="/images/image2.jpg" alt={t.img2} />
            <figcaption>{t.img2}</figcaption>
          </figure>
          <figure>
            <img src="/images/image3.jpg" alt={t.img3} />
            <figcaption>{t.img3}</figcaption>
          </figure>
        </div>
      </section>

      {/* 5. Пространство */}
      <section id="space">
        <h2>{t.space_title}</h2>
        <p>{t.space_p1}</p>
        <p>{t.space_p2}</p>
        <p>{t.space_p3}</p>
      </section>

      <footer>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}
