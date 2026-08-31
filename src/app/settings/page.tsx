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
              <p>Transport rate, delivery ZIP, and fee mode</p>
            </div>
          </div>
          <p className="homeHint">Delivery ZIP defaults to 17545. Transport is $1.35 per mile plus $95 pickup.</p>
        </section>
      </div>
    </main>
  );
}
