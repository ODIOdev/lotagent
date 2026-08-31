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
              <h2>Drafts</h2>
              <p>Worksheets parked before the block</p>
            </div>
          </div>
          <WorksheetList kind="draft" empty="No drafts yet. Save a worksheet from Landed to park it here." />
        </section>
        <section className="homeBlock">
          <div className="homeBlockHead">
            <div>
              <h2>Watchlist</h2>
              <p>Units you are tracking before the block</p>
            </div>
          </div>
          <p className="homeHint">Pin a live unit here when you are ready to track it to sale day.</p>
        </section>
      </div>
    </main>
  );
}
