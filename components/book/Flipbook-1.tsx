/*  
FLIPBOOK PAGE TURN LOGIC (FINAL)

Forward (next):
- Right page turns left.
- transform-origin: left center.
- rotateY(0 → -180deg).

Backward (prev):
- Left page turns right.
- transform-origin: right center.
- rotateY(0 → +180deg).

No DOM reorder.
Only one page animates at a time.
*/
/*
=====================================================================
TECHNICAL SPECIFICATION: FIX FRONT/BACK PAGE SELECTION IN SPREAD MODE
Scope: Flipbook.tsx
Goal: Eliminate double-turn effect by correcting turningPage page logic
=====================================================================

PROBLEM:
The turning page currently uses frontPage and backPage values derived
from pageIndex. This causes turningPage to display pages that do not
match the static left/right pages visible during the animation. As a
result, two different spreads appear simultaneously, producing a
double-turn visual artifact.

REQUIRED FIXES (ALL MANDATORY):

FIX 1 — frontPage and backPage must be computed from displayIndex,
not from pageIndex. displayIndex represents the pages currently visible
on screen and must be the source of truth for turningPage.

FIX 2 — Correct page selection logic:

For NEXT turn:
frontPage = pages[displayIndex + 1]   // right static page
backPage  = pages[displayIndex + 2]   // left page of next spread

For PREV turn:
frontPage = pages[displayIndex]       // left static page
backPage  = pages[displayIndex - 1]   // right page of previous spread

FIX 3 — Remove the old logic:
const frontPage = isNext ? pages[pageIndex + 1] : pages[pageIndex];
const backPage  = isNext ? pages[nextIndex]     : pages[nextIndex + 1];

FIX 4 — Do not modify any other parts of turnPage logic:
- do not change animation timing
- do not change displayIndex/pageIndex update order
- do not change dimming logic
- do not change turningPage rendering structure

EXPECTED RESULT:
turningPage always displays the correct pages relative to the currently
visible spread. No duplicate pages appear during rotation. The double-
turn effect disappears completely, and the animation becomes stable and
physically correct.
=====================================================================

*/

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
  // pageIndex — зафиксированное положение после завершения анимации
  // displayIndex — то, что видно прямо сейчас (обновляется до старта анимации)
  const [pageIndex, setPageIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const [mode, setMode] = useState<Mode>('spread');
  const [turningPage, setTurningPage] = useState<TurningPageState | null>(null);

  // refs на страницы
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Определение режима на основе ширины экрана
  useEffect(() => {
    const handleResize = () => {
      const isSpreadMode = window.innerWidth >= 768;
      setMode(isSpreadMode ? 'spread' : 'single');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Плавное смещение книги в зависимости от номера страницы (только для spread mode)
  const progress = mode === 'spread' ? displayIndex / (pages.length - 2) : 0;
  const shift = (progress - 0.5) * 12;

  // Динамическая тень: от -1 до +1 (только для spread mode)
  const shadowBias = mode === 'spread' ? (progress - 0.5) * 2 : 0;

  const leftPage = mode === 'spread' ? pages[displayIndex] : undefined;
  const rightPage = mode === 'spread' ? pages[displayIndex + 1] : undefined;
  const currentPage = mode === 'single' ? pages[displayIndex] : undefined;

  // ---------- АНИМАЦИЯ ПЕРЕЛИСТЫВАНИЯ ----------
  const turnPage = (direction: "next" | "prev") => {
    if (isTurning) return;
    const isNext = direction === "next";

    if (mode === 'spread') {
      const canNext = pageIndex < pages.length - 2;
      const canPrev = pageIndex > 0;
      if ((isNext && !canNext) || (!isNext && !canPrev)) return;

      const nextIndex = isNext ? pageIndex + 2 : pageIndex - 2;

      // FIX 1 & 2: Compute frontPage and backPage from displayIndex
      const frontPage = isNext ? pages[displayIndex + 1] : pages[displayIndex];
      const backPage = isNext ? pages[displayIndex + 2] : pages[displayIndex - 1];

      // FIX 3: Dim static pages during animation
      leftRef.current?.classList.add(styles.dimmed);
      rightRef.current?.classList.add(styles.dimmed);

      setTurningPage({ direction, frontPage, backPage });
      setIsTurning(true);

      // После анимации убираем буфер и фиксируем индекс
      setTimeout(() => {
        setDisplayIndex(nextIndex); // 1. update displayIndex
        setPageIndex(nextIndex); // 2. update pageIndex
        setTurningPage(null); // 3. remove turningPage
        setIsTurning(false); // 4. set isTurning to false
        // FIX 3: Remove dimmed class after animation
        leftRef.current?.classList.remove(styles.dimmed);
        rightRef.current?.classList.remove(styles.dimmed);
      }, 500);

    } else {
      // SINGLE MODE: одна страница
      const canNext = pageIndex < pages.length - 1;
      const canPrev = pageIndex > 0;
      if ((isNext && !canNext) || (!isNext && !canPrev)) return;

      const nextIndex = isNext ? pageIndex + 1 : pageIndex - 1;
      setDisplayIndex(nextIndex);
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
            setPageIndex(nextIndex);
            setIsTurning(false);
          }, 500);
        });
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      {mode === 'spread' ? (
        // SPREAD MODE
        <div
          className={styles.flipbook}
          style={{
            transform: `perspective(2000px) rotateY(-3deg)`,
            boxShadow: `
              ${-shadowBias * 12}px 0 18px rgba(0,0,0,0.18),
              0 4px 18px rgba(0,0,0,0.12)
            `
          }}
        >
          <div className={styles.innerShadow}></div>
          <div className={styles.page} ref={leftRef}>
            <div className={styles.pageEffects}></div>
            <div className={styles.pageContent}>
              {leftPage && <BookPageRenderer page={leftPage} lang={lang} />}
            </div>
          </div>

          <div className={styles.page} ref={rightRef}>
            <div className={styles.pageEffects}></div>
            <div className={styles.pageContent}>
              {rightPage && <BookPageRenderer page={rightPage} lang={lang} />}
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
                  <BookPageRenderer page={turningPage.frontPage} lang={lang} />
                </div>
              </div>
              <div className={`${styles.turningPageFace} ${styles.turningPageBack}`}>
                <div className={styles.turningPageContent}>
                  <BookPageRenderer page={turningPage.backPage} lang={lang} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // SINGLE MODE
        <div className={styles.singlePageContainer}>
          <div className={styles.singlePage} ref={pageRef}>
            {currentPage && <BookPageRenderer page={currentPage} lang={lang} />}
          </div>
        </div>
      )}

      {!hideControls && (
        <div className={styles.controls}>
          <button
            onClick={() => turnPage("prev")}
            disabled={pageIndex === 0 || isTurning}
          >
            ← Prev
          </button>

          <span className={styles.counter}>
            {mode === 'spread' 
              ? `${displayIndex + 1}–${displayIndex + 2} / ${pages.length}`
              : `${displayIndex + 1} / ${pages.length}`
            }
          </span>

          <button
            onClick={() => turnPage("next")}
            disabled={
              mode === 'spread'
                ? pageIndex >= pages.length - 2 || isTurning
                : pageIndex >= pages.length - 1 || isTurning
            }
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

