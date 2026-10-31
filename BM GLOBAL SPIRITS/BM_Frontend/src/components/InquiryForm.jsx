import React, { useRef, useState } from 'react';
import { Icon } from './Icons.jsx';

export function useFakeFormSubmit(page = '') {
  const formRef = useRef(null);
  const okRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const f = formRef.current;
    if (!f) return;
    let first = null;
    const payload = { page };

    f.querySelectorAll('input, textarea').forEach((i) => {
      if (i.type === 'radio') {
        if (i.checked) payload[i.name] = i.value;
        return;
      }
      payload[i.name] = i.value.trim();
      const field = i.closest('.field');
      if (!field) return;
      let msg = '';
      if (i.required && !i.value.trim()) {
        msg = i.name === 'phone' ? 'Cho chúng tôi số điện thoại để gọi lại.' : 'Vui lòng điền mục này.';
      } else if (i.type === 'tel' && i.value && !/^[+\d][\d\s.-]{7,}$/.test(i.value.trim())) {
        msg = 'Số điện thoại chưa đúng — ví dụ 0901 234 567.';
      } else if (i.type === 'email' && i.value && !i.checkValidity()) {
        msg = 'Email chưa đúng định dạng.';
      }
      field.classList.toggle('is-invalid', !!msg);
      i.setAttribute('aria-invalid', msg ? 'true' : 'false');
      let err = field.querySelector('.field__err');
      if (msg) {
        if (!err) {
          err = document.createElement('p');
          err.className = 'field__err';
          err.id = i.id + 'Err';
          field.appendChild(err);
          i.setAttribute('aria-describedby', err.id);
        }
        err.textContent = msg;
        first = first || i;
      } else if (err) {
        err.remove();
      }
    });

    if (first) {
      first.focus();
      return;
    }

    setSubmitting(true);
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    setTimeout(() => {
      setSent(true);
      setTimeout(() => {
        if (okRef.current) {
          okRef.current.setAttribute('tabindex', '-1');
          okRef.current.focus();
        }
      }, 20);
    }, 700);
  };

  return { formRef, okRef, submitting, sent, onSubmit };
}
