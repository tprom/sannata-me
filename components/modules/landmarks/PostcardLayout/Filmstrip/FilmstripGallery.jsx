"use client";

import { useRef, useState } from "react";
import styles from "./FilmstripGallery.module.css";
import FilmstripFrames from "./FilmstripFrames";
import FilmstripFadeTop from "./FilmstripFadeTop";
import FilmstripFadeBottom from "./FilmstripFadeBottom";

export default function FilmstripGallery({ images = [] }) {
  const [activeImage, setActiveImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const minZoom = 1;
  const maxZoom = 2.6;

  const handleOpen = (image) => {
    setActiveImage(image);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setActiveImage(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.2, maxZoom));
  const zoomOut = () =>
    setZoom((prev) => {
      const next = Math.max(prev - 0.2, minZoom);
      if (next <= minZoom) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });

  const handlePointerDown = (event) => {
    if (zoom <= minZoom) return;
    isDragging.current = true;
    dragStart.current = { x: event.clientX, y: event.clientY };
    panStart.current = { ...pan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handlePointerUp = (event) => {
    isDragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom((prev) => {
      const next = Math.min(Math.max(prev + direction * 0.1, minZoom), maxZoom);
      if (next <= minZoom) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleDoubleClick = () => {
    setZoom((prev) => {
      const next = prev > minZoom ? minZoom : 1.6;
      if (next <= minZoom) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  return (
    <div className={styles.gallery}>
      <FilmstripFadeTop />
      <div className={styles.scrollArea}>
        <FilmstripFrames images={images} onOpen={handleOpen} />
      </div>
      <FilmstripFadeBottom />

      {activeImage && (
        <div className={styles.modal} onClick={handleClose}>
          <div
            className={styles.modalContent}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalToolbar}>
              <div className={styles.modalControls}>
                <button type="button" className={styles.controlButton} onClick={zoomOut}>
                  −
                </button>
                <span className={styles.zoomLabel}>Zoom: {Math.round(zoom * 100)}%</span>
                <button type="button" className={styles.controlButton} onClick={zoomIn}>
                  +
                </button>
              </div>
              <button type="button" className={styles.closeButton} onClick={handleClose}>
                ✕
              </button>
            </div>
            <div
              className={`${styles.modalViewport} ${
                zoom > minZoom ? styles.isDraggable : ""
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={activeImage.src}
                alt={activeImage.alt || "Gallery image"}
                className={styles.modalImage}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
