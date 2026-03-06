"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";

type Props = {
  images: string[];
};

export default function LandmarkGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const minZoom = 1;
  const maxZoom = 2.4;
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const activeImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!activeImageRef.current) return;
    activeImageRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan.x, pan.y, zoom, activeIndex]);

  const safeImages = useMemo(() => {
    return images.length > 0 ? images : ["/images/castle.png"];
  }, [images]);

  const openModal = (index: number) => {
    setActiveIndex(index);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setActiveIndex(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const goPrev = () => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    setPan({ x: 0, y: 0 });
  };

  const goNext = () => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (zoom <= minZoom) return;
    // Панорамирование доступно только при зуме > 1.
    isDragging.current = true;
    dragStart.current = { x: event.clientX, y: event.clientY };
    panStart.current = { ...pan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
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
    <section className="landmark-gallery">
      <h3>Галерея</h3>
      <div className="landmark-gallery-thumbs">
        {safeImages.map((src, index) => (
          <button
            key={`${src}-${index}`}
            className="landmark-gallery-thumb"
            onClick={() => openModal(index)}
          >
            <img src={src} alt={`Gallery ${index + 1}`} />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div className="landmark-gallery-modal">
          <div className="landmark-gallery-backdrop" onClick={closeModal} />
          <div className="landmark-gallery-content">
            <div className="landmark-gallery-toolbar">
              <button className="agent-button" onClick={zoomOut}>
                −
              </button>
              <span>Zoom: {Math.round(zoom * 100)}%</span>
              <button className="agent-button" onClick={zoomIn}>
                +
              </button>
              <button className="agent-button" onClick={closeModal}>
                Закрыть
              </button>
            </div>
            <div className="landmark-gallery-view">
              <button className="agent-button" onClick={goPrev}>
                ←
              </button>
              <div
                className={`landmark-gallery-image ${
                  zoom > 1 ? "is-draggable" : ""
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
                  ref={activeImageRef}
                  src={safeImages[activeIndex]}
                  alt={`Gallery ${activeIndex + 1}`}
                />
              </div>
              <button className="agent-button" onClick={goNext}>
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
