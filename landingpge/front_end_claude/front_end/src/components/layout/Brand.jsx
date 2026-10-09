import { Link } from 'react-router-dom';

export default function Brand({ to = '/', suffix }) {
  return (
    <Link to={to} className="brand" aria-label="HYTale – trang chủ">
      <span className="brand__mark" aria-hidden="true">H</span>
      <span className="brand__name">HYTale{suffix && <small>{suffix}</small>}</span>
    </Link>
  );
}
