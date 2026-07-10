'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

const MIN_ZOOM = 0.3;

/**
 * Full-screen crop/rotate/zoom editor shown after a photo is picked or captured.
 */
export default function ImageEditorModal({ imageSrc, aspect, onCancel, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, '#FDF6EC');
      onSave(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          minZoom={MIN_ZOOM}
          maxZoom={3}
          restrictPosition={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="bg-white rounded-t-2xl p-4 space-y-3 shadow-md">
        <div>
          <label className="admin-label">Zoom</label>
          <input
            type="range"
            min={MIN_ZOOM}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-brown-mid mt-1">
            Zoom out below 100% to fit the whole photo — the extra space fills with the app's background color.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            className="nav-btn flex-1 text-sm"
          >
            ⟲ Rotate
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="nav-btn flex-1 text-sm"
          >
            ⟳ Rotate
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="nav-btn flex-1 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={processing}
            className="flex-1 bg-rose text-white font-nunito font-bold rounded-full py-3 shadow-md disabled:opacity-60"
          >
            {processing ? 'Applying…' : '✓ Use Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
