import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Action, Field } from "@/components/veedu/primitives";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Welcome to Sunnah Home" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useStore("profile", { name: "", city: "Kozhikode", gender: "" });
  const [localProfile, setLocalProfile] = useState(profile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localProfile.name || !localProfile.city || !localProfile.gender) return;
    setProfile(localProfile);
    navigate({ to: "/" });
  };

  return (
    <div
      data-space="home"
      className="relative z-[1] flex min-h-dvh flex-col justify-center px-6 py-16"
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-10 flex items-center gap-3">
          <img
            src="/logo.gif"
            alt="Sunnah Home Logo"
            className="animate-butterfly size-10 object-cover rounded-xl shadow-sm"
          />
          <span className="font-cursive text-4xl tracking-wide text-foreground">Sunnah Home</span>
        </div>

        <h1 className="display-lg">Welcome to Sunnah Home</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Let's personalize your experience. Your location helps us tailor your experience, and
          gender helps us activate specific features like female-only cycle tracking.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field
            label="Your Name"
            value={localProfile.name}
            onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
            placeholder="How should Sunnah Home greet you?"
          />
          <Field
            label="Location (City/Country)"
            value={localProfile.city}
            onChange={(e) => setLocalProfile({ ...localProfile, city: e.target.value })}
            placeholder="e.g. Kozhikode, India"
          />

          <div className="space-y-2">
            <label className="text-foreground/80 block text-[0.8rem] font-semibold tracking-wide">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, gender: "female" })}
                className="press flex items-center justify-center rounded-lg border py-2.5 text-sm"
                style={{
                  background:
                    localProfile.gender === "female" ? "var(--space-accent-soft)" : "transparent",
                  borderColor:
                    localProfile.gender === "female" ? "var(--space-accent)" : "var(--rule)",
                }}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setLocalProfile({ ...localProfile, gender: "male" })}
                className="press flex items-center justify-center rounded-lg border py-2.5 text-sm"
                style={{
                  background:
                    localProfile.gender === "male" ? "var(--space-accent-soft)" : "transparent",
                  borderColor:
                    localProfile.gender === "male" ? "var(--space-accent)" : "var(--rule)",
                }}
              >
                Male
              </button>
            </div>
          </div>

          <Action type="submit" variant="solid" className="w-full mt-4">
            Continue
          </Action>
        </form>
      </div>
    </div>
  );
}
