import type { ManagedImage } from "../../types/domain";
import { Plus, Trash2 } from "lucide-react";
import { ManagedImageEditor } from "./ManagedImageEditor";
import { useMediaUploadState } from "./MediaUploadState";
export function TimelineImagesEditor({
  images = [],
  onChange,
}: {
  images?: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
}) {
  const { busy } = useMediaUploadState();
  return (
    <div className="timeline-images-editor">
      <div className="panel-heading">
        <h3>Ảnh của mốc hành trình</h3>
        <button
          disabled={busy}
          type="button"
          className="button button-small button-outline"
          onClick={() => onChange([...images, { src: "" }])}
        >
          <Plus size={16} />
          Thêm ảnh cho mốc
        </button>
      </div>
      <fieldset disabled={busy} className="timeline-images-fields">
        {images.map((image, index) => (
          <div className="timeline-image-editor" key={index}>
            <ManagedImageEditor
              label={`Ảnh hành trình ${index + 1}`}
              value={image}
              onChange={(next) =>
                onChange(
                  next
                    ? images.map((item, i) => (i === index ? next : item))
                    : images.filter((_, i) => i !== index),
                )
              }
            />
            {!image.src && (
              <button
                type="button"
                className="button button-small button-danger"
                aria-label={`Xóa khung ảnh ${index + 1}`}
                onClick={() => onChange(images.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} />
                Xóa khung ảnh
              </button>
            )}
          </div>
        ))}
      </fieldset>
    </div>
  );
}
