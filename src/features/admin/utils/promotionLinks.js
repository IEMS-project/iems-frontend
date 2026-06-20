export function isExternalPromotionUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

export function openPromotionUrl(url, navigate, fallback = "/premium") {
  const target = url || fallback;

  if (isExternalPromotionUrl(target)) {
    window.open(target, "_blank", "noopener,noreferrer");
    return;
  }

  navigate(target);
}
