'use client';

import { useRef, useState } from 'react';
import ImageEditorModal from './ImageEditorModal';

/**
 * Lets the user pick a photo from their files or take one with the camera,
 * then edit (crop/rotate) it before handing the result to onConfirm.
 */
export default function ImagePicker({
  imageUrl,
  uploading,
  aspect = 4 / 3,
  previewClassName,
  placeholderText,
  onConfirm,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [pendingSrc, setPendingSrc] = useState(null);

  function openEditor(file) {
    if (!file) return;
    setPendingSrc(URL.createObjectURL(file));
  }

  function closeEditor() {
    if (pendingSrc) URL.revokeObjectURL(pendingSrc);
    setPendingSrc(null);
  }

  function handleSave(blob) {
    closeEditor();
    onConfirm(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
  }

  return (
    <div>
      {imageUrl && <img src={imageUrl} alt="Preview" className={previewClassName} />}

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2"
        >
          📁 Choose File
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="font-nunito text-sm text-brown-mid bg-amber-light rounded-full px-4 py-2"
        >
          📷 Take Photo
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          openEditor(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          openEditor(e.target.files[0]);
          e.target.value = '';
        }}
      />

      {uploading && <p className="text-xs text-brown-mid mt-1">Uploading…</p>}
      {placeholderText && <p className="text-xs text-brown-mid mt-1">{placeholderText}</p>}

      {pendingSrc && (
        <ImageEditorModal
          imageSrc={pendingSrc}
          aspect={aspect}
          onCancel={closeEditor}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
