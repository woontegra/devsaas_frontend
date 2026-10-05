export function AdminComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <div className="admin-page-header">
        <h1>{title}</h1>
        <p>Bu modül sonraki fazda etkinleştirilecek.</p>
      </div>
      <section className="admin-panel">
        <div className="admin-panel-body admin-empty">
          Gerçek grafik ve analitik görünümler Faz 3’te eklenecek. Sahte veri gösterilmez.
        </div>
      </section>
    </div>
  );
}
