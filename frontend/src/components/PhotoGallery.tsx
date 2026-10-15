'use client';

import { useEffect, useRef, useState } from 'react';
import type { GalleryPhoto } from '../data/gallery';

export function PhotoGallery({
  photos,
  coverId,
  title,
  galleryId,
  photoLabel,
}: {
  photos: GalleryPhoto[];
  coverId: string;
  title: string;
  galleryId: string;
  photoLabel: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = selectedIndex !== null;
  const selected = selectedIndex === null ? null : photos[selectedIndex];
  const coverIndex = Math.max(
    0,
    photos.findIndex((photo) => photo.id === coverId)
  );
  const cover = photos[coverIndex];

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
    };
  }, [isOpen]);

  const openPhoto = (index: number, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setSelectedIndex(index);
  };
  const move = (direction: number) =>
    setSelectedIndex((index) =>
      index === null
        ? null
        : (index + direction + photos.length) % photos.length
    );

  return (
    <>
      {cover && (
        <button
          type="button"
          className="photo-gallery-cover"
          onClick={(event) => openPhoto(coverIndex, event.currentTarget)}
          aria-label={`Open the featured ${photoLabel} photograph`}
          aria-haspopup="dialog"
        >
          <img
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            fetchPriority="high"
            className="photo-gallery-cover-image"
          />
          <span className="photo-gallery-cover-note">
            View photograph
          </span>
        </button>
      )}

      <section
        id={galleryId}
        className="photo-gallery-gallery-section"
        aria-labelledby={`${galleryId}-title`}
      >
        <div className="photo-gallery-gallery-heading">
          <h2 id={`${galleryId}-title`}>The gallery</h2>
          <span>{photos.length} photographs</span>
        </div>
        <div className="photo-gallery-masonry">
          {photos.map((photo, index) => (
            <button
              type="button"
              key={photo.id}
              className="photo-gallery-photo"
              onClick={(event) => openPhoto(index, event.currentTarget)}
              aria-label={`Open ${photoLabel} photograph ${index + 1} of ${photos.length}: ${photo.alt}`}
              aria-haspopup="dialog"
            >
              <img
                src={photo.thumbnail}
                alt={photo.alt}
                width={photo.thumbnailWidth}
                height={photo.thumbnailHeight}
                loading="lazy"
                decoding="async"
              />
              <span className="photo-gallery-photo-caption">
                {String(index + 1).padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <dialog
          ref={dialogRef}
          className="photo-gallery-viewer"
          aria-labelledby={`${galleryId}-viewer-title`}
          onCancel={() => setSelectedIndex(null)}
          onClose={() => setSelectedIndex(null)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              event.preventDefault();
              move(event.key === 'ArrowRight' ? 1 : -1);
            }
          }}
        >
          <div className="photo-gallery-viewer-layout">
            <div className="photo-gallery-viewer-header">
              <h2 id={`${galleryId}-viewer-title`}>{title}</h2>
              <button
                type="button"
                className="photo-gallery-viewer-button"
                onClick={() => setSelectedIndex(null)}
                aria-label="Close photograph"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M6 18 18 6" />
                </svg>
              </button>
            </div>
            <div
              className="photo-gallery-viewer-media"
              onClick={(event) => {
                if (event.target === event.currentTarget)
                  setSelectedIndex(null);
              }}
            >
              <img
                key={selected.id}
                src={selected.src}
                alt={selected.alt}
                width={selected.width}
                height={selected.height}
              />
            </div>
            <div className="photo-gallery-viewer-footer">
              <span aria-live="polite">
                {String((selectedIndex ?? 0) + 1).padStart(2, '0')} /{' '}
                {photos.length}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="photo-gallery-viewer-button photo-gallery-viewer-text-button"
                  onClick={() => move(-1)}
                  aria-label="Previous photograph"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="photo-gallery-viewer-button photo-gallery-viewer-text-button"
                  onClick={() => move(1)}
                  aria-label="Next photograph"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
