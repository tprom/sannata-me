import styles from "./PostcardStamp.module.css";

export default function PostcardStamp({ stampImage = null }) {
  return (
    <div className={styles.stampWrapper}>
      <div className={styles.stamp}>
        {stampImage ? (
          <img src={stampImage} alt="Postcard stamp" />
        ) : (
          <span>Stamp</span>
        )}
      </div>
      <div className={styles.postmark}>
        <span className={styles.postmarkLine} />
        <span className={styles.postmarkLine} />
        <span className={styles.postmarkLine} />
        <span className={styles.postmarkLine} />
      </div>
    </div>
  );
}
