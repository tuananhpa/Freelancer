import { useState, type FormEvent } from "react";
import { Star, ImagePlus, Send } from "lucide-react";
import { useLanguage, useNotice } from "../app/providers";
import { useResource } from "../hooks/useResource";
import { repository, isMock } from "../services";
import { formatDate } from "./common";
import { isReviewImage } from "../utils/media";
import { MediaImage } from "./Media";
export function ReviewSection({ productId }: { productId: string }) {
  const { t } = useLanguage();
  const notify = useNotice();
  const {
    data: reviews,
    error,
    reload,
  } = useResource(() => repository.reviews.list(productId), [productId]);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  async function selectImage(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setFormError(
        t(
          "Chọn ảnh JPG, PNG hoặc WebP dưới 2 MB.",
          "Choose a JPG, PNG or WebP image under 2 MB.",
        ),
      );
      return;
    }
    setFormError("");
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) {
      setFormError(
        t(
          "Bạn hãy chọn số sao trước khi gửi nhé.",
          "Please choose a star rating first.",
        ),
      );
      return;
    }
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setFormError("");
    try {
      await repository.reviews.add({
        productId,
        name: String(f.get("name")).trim(),
        text: String(f.get("text")).trim(),
        rating,
        image,
      });
      form.reset();
      setRating(0);
      setImage(undefined);
      reload();
      notify(
        isMock
          ? t(
              "Đã lưu cảm nhận. Cảm ơn bạn!",
              "Your review is saved. Thank you!",
            )
          : t(
              "Đã gửi cảm nhận. Cảm ơn bạn!",
              "Your review was sent. Thank you!",
            ),
      );
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="review-section">
      <div className="review-intro">
        <p className="eyebrow">
          {t("Chuyện của người thưởng thức", "Stories from our visitors")}
        </p>
        <h2>
          {t(
            "Bạn thấy câu chuyện này thế nào?",
            "How did this story make you feel?",
          )}
        </h2>
        <p>
          {t(
            "Một cảm nhận nhỏ cũng giúp chuyện quê được kể tiếp.",
            "A small thought helps a story live on.",
          )}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {reviews?.length ? (
          <div className="review-list">
            {reviews.map((r) => (
              <article className="review-item" key={r.id}>
                <div>
                  <strong>{r.name}</strong>
                  <time>{formatDate(r.createdAt)}</time>
                </div>
                <span className="review-stars" aria-label={`${r.rating}/5`}>
                  {Array.from({ length: r.rating }, (_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </span>
                <p>{r.text}</p>
                {r.image && isReviewImage(r.image) && (
                  <MediaImage
                    src={r.image}
                    alt={t("Ảnh cảm nhận của khách", "Visitor photo")}
                    loading="lazy"
                  />
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-review">
            <Star size={22} />
            <p>
              {t(
                "Câu chuyện đang chờ cảm nhận đầu tiên từ bạn.",
                "Be the first to share a thought about this story.",
              )}
            </p>
          </div>
        )}
      </div>
      <form className="review-form form-stack" onSubmit={submit}>
        <fieldset className="star-field">
          <legend>{t("Chọn số sao", "Choose your rating")}</legend>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} ${t("sao", "stars")}`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
              >
                <Star size={29} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          {t("Tên của bạn", "Your name")}
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            placeholder={t("Tên bạn", "Your name")}
          />
        </label>
        <label>
          {t("Cảm nhận của bạn", "Your thoughts")}
          <textarea
            name="text"
            required
            maxLength={1000}
            rows={4}
            placeholder={t(
              "Điều khiến bạn nhớ về câu chuyện này…",
              "What will you remember about this story?",
            )}
          />
        </label>
        <label className="upload-label">
          <ImagePlus size={18} />
          {t("Thêm ảnh cảm nhận (tối đa 2 MB)", "Add a photo (up to 2 MB)")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void selectImage(e.target.files?.[0])}
          />
        </label>
        {image && (
          <div className="review-preview">
            <MediaImage src={image} alt={t("Ảnh đã chọn", "Selected image")} />
            <button type="button" onClick={() => setImage(undefined)}>
              {t("Bỏ ảnh", "Remove image")}
            </button>
          </div>
        )}
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button className="button" disabled={busy}>
          <Send size={16} />
          {busy
            ? t("Đang gửi…", "Sending…")
            : t("Gửi cảm nhận", "Share your thoughts")}
        </button>
      </form>
    </section>
  );
}
