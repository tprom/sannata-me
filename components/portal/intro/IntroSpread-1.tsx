import IntroLeftPage from './IntroLeftPage';
import IntroRightPage from './IntroRightPage';
import styles from './IntroSpread.module.css';

export default function IntroSpread() {
  return (
    <div className={styles.spread}>
      <IntroLeftPage />
      <IntroRightPage />
    </div>
  );
}



