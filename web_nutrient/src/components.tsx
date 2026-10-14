import { useEffect, useRef, type ReactNode } from "react";
import { X, Leaf, Utensils, LoaderCircle, Info } from "lucide-react";
import type { Recipe } from "./types";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Leaf size={25} />
      </span>
      <span>
        NuTri<span className="brand-teens"> Teens</span>
      </span>
    </div>
  );
}
export function Busy() {
  return (
    <span className="busy">
      <LoaderCircle className="spin" size={17} /> Đang xử lý…
    </span>
  );
}
export function Note({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <div className={"note " + tone}>
      <Info size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Empty({
  title = "Chưa có dữ liệu",
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-symbol">
        <Utensils size={28} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Đóng" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Meter({
  value,
  target,
  color = "teal",
}: {
  value: number;
  target: number;
  color?: string;
}) {
  return (
    <div
      className={"meter " + color}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemax={target}
    >
      <span
        style={{
          width: Math.min(100, Math.max(0, (value / target) * 100)) + "%",
        }}
      />
    </div>
  );
}
export function FoodArt({
  recipe,
  small = false,
}: {
  recipe?: Recipe;
  small?: boolean;
}) {
  const photo = recipe
    ? (
        {
          banhmi: "bread",
          yogurt: "yogurt",
          pho: "pho",
          teriyaki: "rice",
        } as Record<string, string>
      )[recipe.id]
    : null;
  return (
    <div
      aria-hidden="true"
      className={
        "food-art " +
        (small ? "small " : "") +
        (recipe?.art ?? "bowl") +
        (photo ? " photo-food photo-" + photo : "")
      }
    >
      <div className="food-plate">
        <span className="food-grain" />
        <span className="food-protein" />
        <span className="food-veg" />
        <span className="food-tomato" />
      </div>
    </div>
  );
}
export function FoodImage({
  imageId,
  recipe,
  small = false,
}: {
  imageId?: string;
  recipe?: Recipe;
  small?: boolean;
}) {
  return imageId ? (
    <img
      className={"meal-image " + (small ? "small" : "")}
      src={"/api/media/" + imageId}
      alt="Ảnh bữa ăn"
    />
  ) : (
    <FoodArt recipe={recipe} small={small} />
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <Info size={19} />
      <span>{message}</span>
      <button aria-label="Đóng thông báo" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
