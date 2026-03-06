'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Flipbook.module.css';
import BookPageRenderer from './BookPageRenderer';

type Props = {
  pages: any[];
  lang: string;
  hideControls?: boolean;
};

type Mode = 'spread' | 'single';

type TurningPageState = {
  direction: 'next' | 'prev';
  frontPage: any;
  backPage: any;
};

export default function Flipbook({ pages, lang, hideControls = false }: Props) {
  // spreadIndex — индекс разворота (0 = страницы 0–1, 1 = 2–3 и т.д.)
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('spread');
  const [isTurning, setIsTurning] = useState(false);
  const [turningPage, setTurningPage] = useState<TurningPageState | null>(null);
  const [pendingTurn, setPendingTurn] = useState<null | 'next' | 'prev'>(null);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // режим
  useEffect(() => {
    const handleResize = () => {
      const isSpreadMode = window.innerWidth >= 768;
      setMode(isSpreadMode ? 'spread' : 'single');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // вычисление страниц
  const leftPageIndex = mode === 'spread' ? spreadIndex * 2 : spreadIndex;
  const rightPageIndex = mode === 'spread' ? spreadIndex * 2 + 1 : spreadIndex;

  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];
  const currentPage = pages[spreadIndex];

  const maxSpreadIndex = Math.floor((pages.length - 1) / 2);

  const turnPage = (direction: 'next' | 'prev') => {
    if (isTurning) {
      setPendingTurn(direction); // queue the request
      return;
    }

    startTurn(direction);
  };

  const startTurn = (direction: 'next' | 'prev') => {
    const isNext = direction === 'next';

    const canNext = spreadIndex < maxSpreadIndex;
    const canPrev = spreadIndex > 0;
    if ((isNext && !canNext) || (!isNext && !canPrev)) return;

    const nextSpreadIndex = isNext ? spreadIndex + 1 : spreadIndex - 1;

    let frontPage;
    let backPage;

    if (isNext) {
      frontPage = rightPage;
      backPage = pages[nextSpreadIndex * 2];
    } else {
      frontPage = leftPage;
      backPage = pages[nextSpreadIndex * 2 + 1];
    }

    leftRef.current?.classList.add(styles.dimmed);
    rightRef.current?.classList.add(styles.dimmed);

    setTurningPage({ direction, frontPage, backPage });
    setIsTurning(true);

    setTimeout(() => {
      setSpreadIndex(nextSpreadIndex);
      setTurningPage(null);
      setIsTurning(false);

      leftRef.current?.classList.remove(styles.dimmed);
      rightRef.current?.classList.remove(styles.dimmed);

      // If user clicked again during animation, execute queued turn
      if (pendingTurn) {
        const nextDirection = pendingTurn;
        setPendingTurn(null);
        startTurn(nextDirection);
      }
    }, 800);
  };

  const handleSingleTurn = (direction: 'next' | 'prev') => {
    if (isTurning) {
      setPendingTurn(direction);
      return;
    }

    const isNext = direction === 'next';
    const canNext = spreadIndex < pages.length - 1;
    const canPrev = spreadIndex > 0;
    if ((isNext && !canNext) || (!isNext && !canPrev)) return;

    const nextIndex = isNext ? spreadIndex + 1 : spreadIndex - 1;
    setIsTurning(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const activePage = pageRef.current;
        if (isNext) {
          activePage?.classList.add(styles.pageTurnSingleForward);
        } else {
          activePage?.classList.add(styles.pageTurnSingleBackward);
        }

        setTimeout(() => {
          activePage?.classList.remove(
            styles.pageTurnSingleForward,
            styles.pageTurnSingleBackward
          );
          setSpreadIndex(nextIndex);
          setIsTurning(false);

          // If user clicked again during animation, execute queued turn
          if (pendingTurn) {
            const nextDirection = pendingTurn;
            setPendingTurn(null);
            handleSingleTurn(nextDirection);
          }
        }, 800);
      });
    });
  };

  const actualTurnPage = (direction: 'next' | 'prev') => {
    if (mode === 'spread') {
      turnPage(direction);
    } else {
      handleSingleTurn(direction);
    }
  };

  return (
    <div className={styles.wrapper}>
      {mode === 'spread' ? (
        <div className={styles.flipbook}>
          <div className={styles.innerShadow}></div>

          <div className={styles.page} ref={leftRef}>
            <div className={styles.pageEffects}></div>
            <div className={styles.pageContent}>
              {leftPage && <BookPageRenderer key={leftPage?.id ?? leftPageIndex} page={leftPage} lang={lang} />}
            </div>
          </div>

          <div className={styles.page} ref={rightRef}>
            <div className={styles.pageEffects}></div>
            <div className={styles.pageContent}>
              {rightPage && <BookPageRenderer key={rightPage?.id ?? rightPageIndex} page={rightPage} lang={lang} />}
            </div>
          </div>

          {turningPage && (
            
            <div
              className={`${styles.turningPage} ${
                turningPage.direction === 'next'
                  ? styles.turningPageForward
                  : styles.turningPageBackward
              }`}
            >
              <div className={`${styles.turningPageFace} ${styles.turningPageFront}`}>
                <div className={styles.turningPageContent}>
                  <BookPageRenderer key={`front-${turningPage.frontPage?.id ?? 'f'}`} page={turningPage.frontPage} lang={lang} />
                </div>
              </div>
              <div className={`${styles.turningPageFace} ${styles.turningPageBack}`}>
                <div className={styles.turningPageContent}>
                  <BookPageRenderer key={`back-${turningPage.backPage?.id ?? 'b'}`} page={turningPage.backPage} lang={lang} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.singlePageContainer}>
          <div className={styles.singlePage} ref={pageRef}>
            {currentPage && <BookPageRenderer key={currentPage?.id ?? spreadIndex} page={currentPage} lang={lang} />}
          </div>
        </div>
      )}

      {!hideControls && (
        <div className={styles.controls}>
          <button
            onClick={() => actualTurnPage('prev')}
            disabled={mode === 'spread' ? spreadIndex === 0 || isTurning : spreadIndex === 0 || isTurning}
          >
            ← Prev
          </button>

          <span className={styles.counter}>
            {mode === 'spread'
              ? `${leftPageIndex + 1}–${rightPageIndex + 1} / ${pages.length}`
              : `${spreadIndex + 1} / ${pages.length}`}
          </span>

          <button
            onClick={() => actualTurnPage('next')}
            disabled={
              mode === 'spread'
                ? spreadIndex >= maxSpreadIndex || isTurning
                : spreadIndex >= pages.length - 1 || isTurning
            }
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
