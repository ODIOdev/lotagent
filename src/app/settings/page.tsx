import { TransportDefaultsForm } from "@/components/settings/transport-defaults";

export default function SettingsPage() {
  return (
    <main className="la page">
      <header className="homeHead">
        <p className="homeMark">LOTAGENT</p>
        <h1>Settings</h1>
      </header>
      <div className="homeSheet">
        <section className="homeBlock">
          <div className="homeBlockHead">
            <div>
              <h2>Defaults</h2>
              <p>Transport rate, delivery ZIP, and pickup fee</p>
            </div>
          </div>
          <TransportDefaultsForm />
        </section>
      </div>
    </main>
  );
}
