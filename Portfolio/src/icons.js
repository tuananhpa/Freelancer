const paths={
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  diagonal:'<path d="M7 17 17 7M7 7h10v10"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
  layers:'<path d="m12 3 10 6-10 6L2 9 12 3Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
  pen:'<path d="m14 5 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14v6Z"/>',
  moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  code:'<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2-13-4 16"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  chevron:'<path d="m8 10 4 4 4-4"/>',
  heart:'<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 8 15 8 15s13-10 8-15Z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
};
export const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.arrow}</svg>`;
