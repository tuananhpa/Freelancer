import React, { useEffect, useRef, useState } from 'react';
import { trap } from '../utils/helpers.js';

export function AgeGate() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem('bm-age-ok') !== '1';
    } catch (e) {
      return true;
    }
  });
  const [done, setDone] = useState(false);
  const [denied, setDenied] = useState(false);
  const gateRef = useRef(null);
  const yesBtnRef = useRef(null);
  const untrapRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const g = gateRef.current;
    if (!g) return;
    document.body.classList.add('is-locked');
    untrapRef.current = trap(g);
    yesBtnRef.current && yesBtnRef.current.focus();
    return () => {
      if (untrapRef.current) untrapRef.current();
      document.body.classList.remove('is-locked');
    };
  }, [visible]);

  if (!visible) return null;

  const handleYes = () => {
    try {
      localStorage.setItem('bm-age-ok', '1');
    } catch (err) {
      /* chế độ riêng tư */
    }
    if (untrapRef.current) {
      untrapRef.current();
      untrapRef.current = null;
    }
    setDone(true);
    document.body.classList.remove('is-locked');
    document.dispatchEvent(new CustomEvent('bm:age-ok'));
    setTimeout(() => setVisible(false), 800);
  };

  return (
    <div
      ref={gateRef}
      className={`gate${done ? ' is-done' : ''}${denied ? ' is-denied' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateTitle"
    >
      <span className="gate__beam" aria-hidden="true"></span>
      <div className="gate__box">
        <img className="gate__mark" src="assets/img/brand/mark.svg" alt="BM Global Spirits" width="64" height="75" />
        <h2 id="gateTitle">Bạn đã đủ 18 tuổi?</h2>
        <p>Website giới thiệu đồ uống có cồn, chỉ dành cho người từ 18 tuổi trở lên.</p>
        <div className="gate__actions">
          <button ref={yesBtnRef} className="btn" type="button" data-age="yes" onClick={handleYes}>
            Tôi đã đủ 18 tuổi
          </button>
          <button className="btn btn--ghost" type="button" data-age="no" onClick={() => setDenied(true)}>
            Chưa đủ 18 tuổi
          </button>
        </div>
        <p className="gate__no">Hẹn gặp lại bạn khi đủ tuổi. Cảm ơn bạn đã ghé thăm.</p>
        <p className="gate__law">
          Theo Luật Phòng, chống tác hại của rượu, bia — không bán rượu cho người dưới 18 tuổi.
        </p>
      </div>
    </div>
  );
}
