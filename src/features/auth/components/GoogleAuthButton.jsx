import React, { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Không thể tải Google script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google script"));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({ onCredential, text = "continue_with" }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initGoogleButton() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          setError("Thiếu cấu hình VITE_GOOGLE_CLIENT_ID");
          return;
        }

        await loadGoogleScript();
        if (!active || !window.google?.accounts?.id || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential?.(response.credential);
            }
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text,
          width: 320,
        });
      } catch (e) {
        setError(e?.message || "Không thể khởi tạo Google Login");
      }
    }

    initGoogleButton();

    return () => {
      active = false;
    };
  }, [onCredential, text]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
