import { WorksheetList } from "@/components/lists/worksheet-list";

export default function WatchPage() {
  return (
    <main className="la page">
      <header className="homeHead">
        <p className="homeMark">LOTAGENT</p>
        <h1>Watch</h1>
      </header>
      <div className="homeSheet">
        <section className="homeBlock">
          <div className="homeBlockHead">
            <div>
              <h2>Watchlist</h2>
              <p>Units you are tracking before the block</p>
            </div>
          </div>
          <WorksheetList
            kind="watch"
            empty="No units yet. Hit Watch on a landed worksheet to track it here."
          />
        </section>
      </div>
    </main>
  );
}
