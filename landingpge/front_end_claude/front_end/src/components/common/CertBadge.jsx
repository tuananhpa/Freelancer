import { CERTIFICATIONS } from '@/config/constants';
import Icon from './Icon';

const ICON = { red: 'star', green: 'check', dark: 'pin' };

export default function CertBadge({ code }) {
  const cert = CERTIFICATIONS[code];
  if (!cert) return null;
  return (
    <span className={`badge badge--${cert.tone}`}>
      <Icon name={ICON[cert.tone]} size={13} strokeWidth={2.4} />
      {cert.label}
    </span>
  );
}
