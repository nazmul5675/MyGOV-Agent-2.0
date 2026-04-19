export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-white/60 py-10 backdrop-blur-xl">
      <div className="container-shell flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">MyGOV Agent 2.0</p>
          <p>
            Premium GovTech intake, tracking, and admin review for
            citizen-first digital services.
          </p>
        </div>
        <div className="flex gap-6">
          <span>Privacy-first</span>
          <span>RBAC ready</span>
          <span>Gemini ready</span>
        </div>
      </div>
    </footer>
  );
}
