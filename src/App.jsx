import { useState, useMemo } from "react";

const INITIAL_BF = [
  { id: 1, label: "Acompte Phase 1 — Greenwood", montant: 18000, type: "entrée", cat: "Projet", statut: "encaissé", date: "2026-03-01" },
  { id: 2, label: "Design graphique — Greenwood", montant: 2000, type: "entrée", cat: "Projet", statut: "encaissé", date: "2026-03-15" },
  { id: 3, label: "Facture Greenwood — Presta + Pub", montant: 7500, type: "entrée", cat: "Projet", statut: "en attente", date: "2026-04-15" },
  { id: 4, label: "Acompte 50% — Twelve Stays", montant: 37500, type: "entrée", cat: "Projet", statut: "en attente", date: "2026-04-20" },
  { id: 5, label: "Acompte 50% — Choukrallah", montant: 9000, type: "entrée", cat: "Projet", statut: "en attente", date: "2026-04-30" },
  { id: 6, label: "Airtable Teams — imprévu", montant: -3000, type: "dépense", cat: "Abonnement", statut: "payé", date: "2026-04-01" },
  { id: 7, label: "Déclaration T1 2026 — IR", montant: -200, type: "dépense", cat: "Fiscal", statut: "en attente", date: "2026-04-20" },
];

const INITIAL_PERSO = [
  { id: 1, label: "Remboursement cash chéri", montant: -2100, type: "dépense", cat: "Personnel", statut: "en attente", date: "2026-04-25" },
  { id: 2, label: "Taxe I Love Bali (7$)", montant: -70, type: "dépense", cat: "Voyage", statut: "en attente", date: "2026-04-28" },
  { id: 3, label: "Budget vie Bali — 1 mois", montant: -3000, type: "dépense", cat: "Voyage", statut: "en attente", date: "2026-05-01" },
  { id: 4, label: "Visa USA + billet avion", montant: -4000, type: "dépense", cat: "Voyage", statut: "en attente", date: "2026-07-01" },
];

const CATS_BF = ["Projet", "Abonnement", "Fiscal", "Marketing", "Autre"];
const CATS_PERSO = ["Personnel", "Voyage", "Logement", "Épargne", "Investissement", "Autre"];

const fmt = (n) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 0 }).format(Math.abs(n)) + " DH";

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)", border: `1px solid ${color}30`,
    borderRadius: 12, padding: "16px 20px", borderTop: `3px solid ${color}`
  }}>
    <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, textTransform: "uppercase", fontFamily: "DM Mono, monospace", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "DM Mono, monospace", letterSpacing: -1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 4, fontFamily: "DM Mono, monospace" }}>{sub}</div>}
  </div>
);

const ProgressBar = ({ value, max, color }) => {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", fontFamily: "DM Mono, monospace", marginBottom: 4 }}>
        <span>Point mort</span><span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
};

function Section({ title, color, emoji, data, setData, cats, charges }) {
  const [form, setForm] = useState({ label: "", montant: "", type: "entrée", cat: cats[0], statut: "en attente", date: new Date().toISOString().split("T")[0] });
  const [tab, setTab] = useState("tout");

  const encaissé = data.filter(t => t.type === "entrée" && t.statut === "encaissé").reduce((s, t) => s + t.montant, 0);
  const attendu = data.filter(t => t.type === "entrée" && t.statut === "en attente").reduce((s, t) => s + t.montant, 0);
  const dépenses = data.filter(t => t.type === "dépense").reduce((s, t) => s + Math.abs(t.montant), 0);
  const balance = encaissé - dépenses;

  const add = () => {
    if (!form.label || !form.montant) return;
    const m = form.type === "dépense" ? -Math.abs(parseFloat(form.montant)) : Math.abs(parseFloat(form.montant));
    setData(prev => [...prev, { ...form, id: Date.now(), montant: m }]);
    setForm(f => ({ ...f, label: "", montant: "" }));
  };

  const remove = (id) => setData(prev => prev.filter(t => t.id !== id));
  const toggle = (id) => setData(prev => prev.map(t => t.id === id ? { ...t, statut: t.statut === "encaissé" ? "en attente" : t.statut === "payé" ? "en attente" : "encaissé" } : t));

  const filtered = tab === "tout" ? data : tab === "entrées" ? data.filter(t => t.type === "entrée") : data.filter(t => t.type === "dépense");

  const statusEvolution = () => {
    if (balance > 5000) return { label: "En croissance 📈", color: "#1db954" };
    if (balance > 0) return { label: "Stable ⚖️", color: "#c9a84c" };
    return { label: "Déficit ⚠️", color: "#e85d5d" };
  };
  const evo = statusEvolution();

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>{emoji} {title}</div>
        <div style={{ fontSize: 11, fontFamily: "DM Mono, monospace", padding: "4px 12px", borderRadius: 20, background: `${evo.color}18`, color: evo.color, border: `1px solid ${evo.color}30` }}>{evo.label}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Encaissé" value={fmt(encaissé)} color="#1db954" />
        <StatCard label="Dépenses" value={fmt(dépenses)} color="#e85d5d" />
        <StatCard label="Balance nette" value={(balance >= 0 ? "+" : "-") + fmt(balance)} color={balance >= 0 ? color : "#e85d5d"} sub={`+ ${fmt(attendu)} attendu`} />
      </div>

      {charges > 0 && <ProgressBar value={encaissé} max={charges} color={color} />}

      {/* Formulaire ajout */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, marginBottom: 16, marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, textTransform: "uppercase", fontFamily: "DM Mono, monospace", marginBottom: 12 }}>Ajouter une transaction</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="Intitulé..." style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 13, fontFamily: "Syne, sans-serif" }} />
          <input value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
            placeholder="Montant DH" type="number" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 13, fontFamily: "DM Mono, monospace" }} />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 12 }}>
            <option value="entrée">➕ Entrée</option>
            <option value="dépense">➖ Dépense</option>
          </select>
          <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 12 }}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 12 }}>
            <option value="encaissé">✅ Encaissé</option>
            <option value="en attente">⏳ En attente</option>
            <option value="payé">💸 Payé</option>
          </select>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#f0ede6", fontSize: 12 }} />
          <button onClick={add} style={{ background: color, border: "none", borderRadius: 8, padding: "8px 20px", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Syne, sans-serif" }}>+ Ajouter</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["tout", "entrées", "dépenses"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? color : "rgba(255,255,255,0.05)", border: "none", borderRadius: 6,
            padding: "5px 14px", color: tab === t ? "#000" : "#888", fontSize: 11, cursor: "pointer",
            fontFamily: "DM Mono, monospace", textTransform: "capitalize", fontWeight: tab === t ? 700 : 400
          }}>{t}</button>
        ))}
      </div>

      {/* Liste transactions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.statut === "encaissé" || t.statut === "payé" ? "#1db954" : "#c9a84c", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: "#666", fontFamily: "DM Mono, monospace", marginTop: 2 }}>{t.cat} · {t.date} · <span style={{ color: t.statut === "encaissé" || t.statut === "payé" ? "#1db954" : "#c9a84c" }}>{t.statut}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "DM Mono, monospace", color: t.montant >= 0 ? "#1db954" : "#e85d5d" }}>
                {t.montant >= 0 ? "+" : "-"}{fmt(t.montant)}
              </div>
              <button onClick={() => toggle(t.id)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 4, padding: "3px 8px", color: "#888", fontSize: 10, cursor: "pointer" }}>✓</button>
              <button onClick={() => remove(t.id)} style={{ background: "rgba(232,93,93,0.1)", border: "none", borderRadius: 4, padding: "3px 8px", color: "#e85d5d", fontSize: 10, cursor: "pointer" }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinanceDashboard() {
  const [bf, setBf] = useState(INITIAL_BF);
  const [perso, setPerso] = useState(INITIAL_PERSO);
  const [epargne, setEpargne] = useState(0);
  const [investissement, setInvestissement] = useState(0);

  const totalBF = bf.filter(t => t.type === "entrée" && t.statut === "encaissé").reduce((s, t) => s + t.montant, 0)
    - bf.filter(t => t.type === "dépense").reduce((s, t) => s + Math.abs(t.montant), 0);

  const totalPerso = perso.filter(t => t.type === "dépense").reduce((s, t) => s + Math.abs(t.montant), 0);
  const totalAttendu = [...bf, ...perso].filter(t => t.type === "entrée" && t.statut === "en attente").reduce((s, t) => s + t.montant, 0);

  const caisse = 4900;
  const netTotal = caisse + totalBF - totalPerso - epargne - investissement;

  const globalEvo = () => {
    if (netTotal > 20000) return { label: "En forte croissance 🚀", color: "#1db954" };
    if (netTotal > 5000) return { label: "En évolution 📈", color: "#4a9eff" };
    if (netTotal > 0) return { label: "Point mort stable ⚖️", color: "#c9a84c" };
    return { label: "Déficit — action requise ⚠️", color: "#e85d5d" };
  };
  const evo = globalEvo();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: 28, fontFamily: "Syne, sans-serif", color: "#f0ede6" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap'); input,select{outline:none;} input::placeholder{color:#555;} button:hover{opacity:0.85;}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>💰 BlazeFlow Finance</div>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "DM Mono, monospace", marginTop: 3 }}>Tableau de bord financier — Bouthaina</div>
        </div>
        <div style={{ padding: "6px 16px", borderRadius: 20, background: `${evo.color}15`, color: evo.color, border: `1px solid ${evo.color}30`, fontSize: 12, fontWeight: 600 }}>{evo.label}</div>
      </div>

      {/* Métriques globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard label="Caisse actuelle" value={fmt(caisse)} color="#c9a84c" sub="Disponible maintenant" />
        <StatCard label="Revenus BF nets" value={(totalBF >= 0 ? "+" : "") + fmt(totalBF)} color="#1db954" sub="Projets encaissés" />
        <StatCard label="À encaisser" value={"+" + fmt(totalAttendu)} color="#4a9eff" sub="Deals en attente" />
        <StatCard label="Net disponible" value={(netTotal >= 0 ? "+" : "-") + fmt(netTotal)} color={netTotal >= 0 ? "#c9a84c" : "#e85d5d"} sub="Après tout" />
      </div>

      {/* Épargne & Investissement */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>🏦 Épargne & Investissements</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", fontFamily: "DM Mono, monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Épargne mise de côté</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" value={epargne} onChange={e => setEpargne(+e.target.value)} placeholder="0 DH"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(74,158,255,0.3)", borderRadius: 8, padding: "10px 14px", color: "#4a9eff", fontSize: 14, fontFamily: "DM Mono, monospace" }} />
              <div style={{ fontSize: 11, color: "#4a9eff", fontFamily: "DM Mono, monospace" }}>DH</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", fontFamily: "DM Mono, monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Investissements</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" value={investissement} onChange={e => setInvestissement(+e.target.value)} placeholder="0 DH"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(155,127,232,0.3)", borderRadius: 8, padding: "10px 14px", color: "#9b7fe8", fontSize: 14, fontFamily: "DM Mono, monospace" }} />
              <div style={{ fontSize: 11, color: "#9b7fe8", fontFamily: "DM Mono, monospace" }}>DH</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ background: "rgba(74,158,255,0.08)", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(74,158,255,0.15)" }}>
            <div style={{ fontSize: 10, color: "#4a9eff", fontFamily: "DM Mono, monospace", letterSpacing: 1 }}>ÉPARGNE TOTALE</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#4a9eff", fontFamily: "DM Mono, monospace", marginTop: 4 }}>{fmt(epargne)}</div>
          </div>
          <div style={{ background: "rgba(155,127,232,0.08)", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(155,127,232,0.15)" }}>
            <div style={{ fontSize: 10, color: "#9b7fe8", fontFamily: "DM Mono, monospace", letterSpacing: 1 }}>INVESTI</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#9b7fe8", fontFamily: "DM Mono, monospace", marginTop: 4 }}>{fmt(investissement)}</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <Section title="Trésorerie BlazeFlow" color="#c9a84c" emoji="🔥" data={bf} setData={setBf} cats={CATS_BF} charges={27500} />
      <Section title="Finance Personnelle" color="#4a9eff" emoji="🌸" data={perso} setData={setPerso} cats={CATS_PERSO} charges={9170} />
    </div>
  );
}
