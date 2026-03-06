import styles from "./FilmstripFrames.module.css";

export default function FilmstripFrames({ images = [], onOpen }) {
  const safeImages = Array.isArray(images) ? images : [];
  const minimumFrames = 8;
  const fillersCount = Math.max(0, minimumFrames - safeImages.length);
  const fillers = Array.from({ length: fillersCount }, (_, index) => ({
    id: `filmstrip-filler-${index}`,
    isFiller: true,
  }));

  const frames = [...safeImages, ...fillers];

  return (
    <div className={styles.frames}>
      {frames.map((image, index) =>
        image.isFiller ? (
          <div
            key={image.id || `filler-${index}`}
            className={`${styles.frame} ${styles.filler}`}
            aria-hidden="true"
          />
        ) : (
          <button
            key={image.id || `${image.src}-${index}`}
            className={styles.frame}
            onClick={() => onOpen?.(image)}
            type="button"
          >
            <img
              src={image.src}
              alt={image.alt || "Film frame"}
              className={styles.image}
            />
          </button>
        ),
      )}
    </div>
  );
}
