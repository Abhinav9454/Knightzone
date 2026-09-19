import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number | string;
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  onCredential: (idToken: string) => Promise<void>;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleAuthButton({
  onCredential,
  disabled = false,
  text = "continue_with",
}: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || disabled) return;

    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: "popup",
        callback: async (response) => {
          if (!response.credential) return;
          await onCredential(response.credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text,
        width: "100%",
        logo_alignment: "left",
      });
      setIsReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if (window.google?.accounts?.id) {
        renderButton();
      } else {
        existingScript.addEventListener("load", renderButton, { once: true });
      }
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [disabled, onCredential, text]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/70" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span className="bg-background px-3">Or continue with</span>
        </div>
      </div>
      <div
        ref={buttonRef}
        className={disabled ? "pointer-events-none opacity-70" : ""}
      />
      {!isReady ? (
        <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-center text-xs text-muted-foreground">
          Preparing Google Sign-In...
        </div>
      ) : null}
    </div>
  );
}
