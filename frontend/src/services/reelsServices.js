import api from './api';

// Public-facing reels (used by the storefront slider)
export const getActiveReels = async () => {
  const { data } = await api.get('/reels');
  // only show active reels on the storefront, sorted by order
  return data
    .filter((reel) => reel.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

// format a raw view count (e.g. 13200) into "13.2K" / "1.1M" for display
export const formatViews = (views) => {
  const n = Number(views) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${n}`;
};