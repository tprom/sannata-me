import styles from './ImageBlock.module.css';

export default function ImageBlock({ src }: { src: string }) {
  return (
    <div className={styles.wrapper}>
      <img src={src} className={styles.image} />
    </div>
  );
}
