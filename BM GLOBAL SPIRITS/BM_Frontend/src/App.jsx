import React, { useEffect, useState } from 'react';
import { IconSprite } from './components/Icons';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AgeGate } from './components/AgeGate';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import {
  D,
  P,
  byId,
  CAT,
  TYPE,
  count,
  brandName,
  brandOrigin,
  groupName,
  realBrands,
  countries,
  fmtAbv,
  esc,
  url,
  img,
  srcset,
  glow,
  metaLine,
  topBrands,
  matchFilter,
  fold,
  search,
  trap,
  pop,
  toast,
  askText,
  copy,
  copyAsk
} from './utils/helpers';
import { SITE } from './data/siteConfig';

function resolvePage() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('/san-pham.html') || path.endsWith('/san-pham')) return 'catalog';
  if (path.endsWith('/chi-tiet-san-pham.html') || path.endsWith('/chi-tiet-san-pham')) return 'product';
  if (path.endsWith('/gioi-thieu.html') || path.endsWith('/gioi-thieu')) return 'about';
  if (path.endsWith('/lien-he.html') || path.endsWith('/lien-he')) return 'contact';
  if (path.endsWith('/index.html') || path === '/' || path === '') return 'home';
  return document.body?.dataset?.page || 'home';
}

export function App() {
  const [page] = useState(() => resolvePage());

  useEffect(() => {
    document.body.dataset.page = page;
    window.BM = {
      D,
      P,
      SITE,
      byId,
      CAT,
      TYPE,
      count,
      brandName,
      brandOrigin,
      groupName,
      realBrands,
      countries,
      fmtAbv,
      esc,
      url,
      img,
      srcset,
      glow,
      metaLine,
      topBrands,
      matchFilter,
      fold,
      search,
      trap,
      pop,
      toast,
      askText,
      copy,
      copyAsk
    };
  }, [page]);

  return (
    <>
      <IconSprite />
      <Header page={page} />
      {page === 'home' && <HomePage />}
      {page === 'catalog' && <CatalogPage />}
      {page === 'product' && <ProductPage />}
      {page === 'about' && <AboutPage />}
      {page === 'contact' && <ContactPage />}
      <Footer page={page} />
      <AgeGate />
    </>
  );
}

export default App;
