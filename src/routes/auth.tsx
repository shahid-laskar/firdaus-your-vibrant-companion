import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Action, Field } from "@/components/veedu/primitives";
import { useStore, syncFromCloud } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Sunnah Home" },
      {
        name: "description",
        content:
          "Sign in to sync Sunnah Home across your devices, or continue as a guest with everything stored privately on this device.",
      },
      { property: "og:title", content: "Sign in to Sunnah Home" },
      {
        property: "og:description",
        content: "Sync across devices, or keep everything local as a guest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "register" | "magic" | "reset";

const COPY: Record<Mode, { title: string; body: string; cta: string }> = {
  signin: { title: "Welcome back", body: "Your home, exactly as you left it.", cta: "Sign in" },
  register: {
    title: "Make it yours",
    body: "One account keeps Sunnah Home with you across devices.",
    cta: "Create account",
  },
  magic: {
    title: "No password",
    body: "We'll send a link that signs you straight in.",
    cta: "Send link",
  },
  reset: { title: "Reset password", body: "We'll email you a way back in.", cta: "Send reset" },
};

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useStore<{ email: string } | null>("account", null);
  const [profile] = useStore("profile", {
    name: "",
    city: "Kozhikode",
    gender: "",
    lat: 11.2588,
    lng: 75.7804,
    madhab: "shafi",
    method: "MuslimWorldLeague",
  });
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const copy = COPY[mode];

  return (
    <div
      data-space="home"
      className="relative z-[1] flex min-h-dvh flex-col justify-center px-6 py-16"
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 flex items-baseline gap-2">
          <span className="font-display text-xl">Sunnah Home</span>
          <span className="bg-space size-[5px] rounded-full" />
        </div>

        <h1 className="display-lg">{copy.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.body}</p>

        {account ? (
          <div className="mt-8">
            <p className="text-[0.95rem]">Signed in as {account.email}</p>
            <div className="mt-4 flex gap-2">
              <Action variant="solid" onClick={() => navigate({ to: "/" })}>
                Go home
              </Action>
              <Action
                onClick={async () => {
                  await supabase.auth.signOut();
                  setAccount(null);
                }}
              >
                Sign out
              </Action>
            </div>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!email.trim()) return;

              if (mode === "magic") {
                const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
                if (!error) setSent(true);
                else alert(error.message);
                return;
              }
              if (mode === "reset") {
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
                if (!error) setSent(true);
                else alert(error.message);
                return;
              }

              if (mode === "register") {
                const { data, error } = await supabase.auth.signUp({
                  email: email.trim(),
                  password,
                });
                if (error) {
                  alert(error.message);
                  return;
                }
                if (data.user) setAccount({ email: data.user.email! });
                navigate({ to: "/onboarding" });
                return;
              }

              if (mode === "signin") {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: email.trim(),
                  password,
                });
                if (error) {
                  alert(error.message);
                  return;
                }
                if (data.user) setAccount({ email: data.user.email! });

                await syncFromCloud();

                const rawProfile = window.localStorage.getItem("veedu:profile");
                const freshProfile = rawProfile ? JSON.parse(rawProfile) : {};

                if (freshProfile.name) {
                  navigate({ to: "/" });
                } else {
                  navigate({ to: "/onboarding" });
                }
              }
            }}
            className="mt-8 space-y-4"
          >
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {(mode === "signin" || mode === "register") && (
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
            <Action type="submit" variant="solid" className="w-full">
              {copy.cta}
            </Action>
            {sent && (
              <p className="text-ink-soft text-xs">Check your inbox — the link is on its way.</p>
            )}
          </form>
        )}

        <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {(["signin", "register", "magic", "reset"] as Mode[])
            .filter((m) => m !== mode)
            .map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setSent(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {m === "signin"
                  ? "Sign in"
                  : m === "register"
                    ? "Create account"
                    : m === "magic"
                      ? "Magic link"
                      : "Forgot password"}
              </button>
            ))}
        </div>

        <div className="rule-line my-8" />

        <button
          onClick={() => navigate({ to: "/" })}
          className="press text-ink-soft hover:text-foreground text-left text-sm"
        >
          Continue as guest →
          <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
            Everything stays on this device. Nothing is sent anywhere until you decide.
          </span>
        </button>
      </div>
    </div>
  );
}
