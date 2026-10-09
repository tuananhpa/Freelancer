import { useState, useId, type FormEvent } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Modal } from "./common";
import { useLanguage } from "../app/providers";
import { repository, isMock } from "../services";
import { useResource } from "../hooks/useResource";
import { isValidPhone, orderUnits } from "../services/inquiries";
export function InquiryModal({
  onClose,
  productId,
  type = "purchase",
}: {
  onClose: () => void;
  productId?: string;
  type?: "purchase" | "partner";
}) {
  const { lang, t } = useLanguage();
  const unitListId = useId();
  const {
    data: products,
    error: productsError,
    reload,
  } = useResource(() => repository.products.list());
  const [selectedId, setSelectedId] = useState(productId ?? "");
  const selectedProduct = products?.find((p) => p.id === selectedId);
  const [customUnit, setCustomUnit] = useState<string | null>(null);
  const unit = customUnit ?? selectedProduct?.orderUnit ?? "kg";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await repository.inquiries.add({
        name: String(f.get("name")).trim(),
        phone: String(f.get("phone")).trim(),
        note: String(f.get("note")).trim(),
        productId: type === "purchase" ? selectedProduct?.id : productId,
        ...(type === "purchase"
          ? {
              quantity: Number(f.get("quantity")),
              unit,
              productName: selectedProduct?.name,
            }
          : {}),
        type,
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        type === "partner"
          ? t("Cùng kể câu chuyện của bạn", "Let’s tell your story")
          : t("Gửi một thức quà quê", "Request a gift from home")
      }
      onClose={onClose}
    >
      {done ? (
        <div className="success-panel">
          <CheckCircle2 size={44} />
          <h3>{t("Đã lưu yêu cầu", "Your inquiry is saved")}</h3>
          <p>
            {isMock
              ? t(
                  "Yêu cầu được lưu trong bản demo trên trình duyệt này. Bạn có thể xem tại Không gian quản trị → Yêu cầu kết nối.",
                  "Your inquiry is saved in this browser demo. View it in the admin workspace.",
                )
              : t(
                  "HYTales sẽ liên hệ qua số điện thoại bạn cung cấp.",
                  "HYTales will contact you using the phone number you provided.",
                )}
          </p>
          <button className="button" onClick={onClose}>
            {t("Tiếp tục khám phá", "Keep exploring")}
          </button>
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <p>
            {t(
              "Để lại thông tin, cùng kết nối với người làm nên thức quà.",
              "Leave your details and connect with the people behind the produce.",
            )}
          </p>
          {isMock && (
            <div className="demo-note">
              {t(
                "Bản trải nghiệm: không phát sinh đơn hàng hay thanh toán.",
                "Demo experience: no real order or payment will be processed.",
              )}
            </div>
          )}
          {type === "purchase" && (
            <div className="inquiry-selection">
              <label>
                {t("Sản phẩm", "Product")} {" *"}
                <select
                  name="productId"
                  required
                  value={selectedProduct?.id ?? ""}
                  disabled={busy || !products}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setCustomUnit(null);
                  }}
                >
                  <option value="">
                    {t("Chọn thức quà bạn muốn", "Choose your produce")}
                  </option>
                  {products?.map((p) => (
                    <option value={p.id} key={p.id}>
                      {lang === "en" ? p.nameEn || p.name : p.name}
                    </option>
                  ))}
                </select>
              </label>
              {productsError && (
                <p className="form-error" role="alert">
                  {productsError}{" "}
                  <button
                    type="button"
                    className="underlined-link"
                    onClick={reload}
                  >
                    {t("Thử lại", "Retry")}
                  </button>
                </p>
              )}
              {products && !products.length && (
                <p role="status">
                  {t(
                    "Hiện chưa có sản phẩm nhận yêu cầu.",
                    "No produce is currently available.",
                  )}
                </p>
              )}
              <div className="form-grid">
                <label>
                  {t("Số lượng", "Quantity")} {" *"}
                  <input
                    name="quantity"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="any"
                    defaultValue="1"
                    required
                    disabled={busy}
                  />
                </label>
                <label>
                  {t("Đơn vị", "Unit")} {" *"}
                  <input
                    name="unit"
                    list={unitListId}
                    value={unit}
                    maxLength={30}
                    required
                    disabled={busy}
                    onChange={(e) => setCustomUnit(e.target.value)}
                  />
                </label>
              </div>
              <datalist id={unitListId}>
                {[
                  ...new Set(
                    [selectedProduct?.orderUnit, ...orderUnits].filter(Boolean),
                  ),
                ].map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              <small>
                {t(
                  "Đơn vị được gợi ý theo sản phẩm. Bạn có thể chọn hoặc nhập đơn vị khác.",
                  "The unit follows your selected product. Choose a suggestion or enter another unit.",
                )}
              </small>
            </div>
          )}
          <label>
            {t("Tên của bạn", "Your name")} {" *"}
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              autoComplete="name"
              maxLength={80}
              required
              placeholder={t(
                "Bạn muốn chúng mình gọi là…",
                "How should we call you?",
              )}
            />
          </label>
          <label>
            {t("Số điện thoại", "Phone number")} {" *"}
            <input
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
              type="tel"
              autoComplete="tel"
              maxLength={25}
              required
              placeholder="09xx xxx xxx"
            />
          </label>
          <label>
            {t("Lời nhắn", "Your message")}
            <textarea
              name="note"
              maxLength={1000}
              rows={3}
              placeholder={
                type === "partner"
                  ? t(
                      "Sản phẩm, nhà vườn hoặc HTX của bạn…",
                      "Tell us about your farm or cooperative…",
                    )
                  : t(
                      "Dịp tặng quà, thời gian mong muốn, điều bạn muốn hỏi…",
                      "Occasion, preferred time or anything you’d like to ask…",
                    )
              }
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" required />
            {t(
              "Tôi đồng ý dùng thông tin này để liên hệ về yêu cầu của tôi.",
              "I agree to be contacted about this inquiry.",
            )}
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <small>
            {t(
              "Vui lòng nhập tên và số điện thoại hợp lệ để gửi yêu cầu.",
              "Enter your name and a valid phone number to send your inquiry.",
            )}
          </small>
          <button
            disabled={
              busy ||
              !name.trim() ||
              !isValidPhone(phone) ||
              (type === "purchase" && !selectedProduct)
            }
            className="button"
            type="submit"
          >
            <Send size={17} />
            {busy
              ? t("Đang lưu…", "Saving…")
              : t("Gửi yêu cầu", "Send inquiry")}
          </button>
        </form>
      )}
    </Modal>
  );
}
