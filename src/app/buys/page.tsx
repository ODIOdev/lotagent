import { WorksheetList } from "@/components/lists/worksheet-list";

export default function BuysPage() {
  return (
    <main className="la page">
      <header className="homeHead">
        <p className="homeMark">LOTAGENT</p>
        <h1>Buys</h1>
      </header>
      <div className="homeSheet">
        <section className="homeBlock">
          <div className="homeBlockHead">
            <div>
              <h2>Purchases</h2>
              <p>Won units and what they actually landed at</p>
            </div>
          </div>
          <WorksheetList kind="buy" empty="No purchases yet. Hit Buy on a landed worksheet to send it here." />
        </section>
      </div>
    </main>
  );
}
