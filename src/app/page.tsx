import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAppHost, appBaseUrl } from "@/lib/host";
import {
  IconUsers, IconDumbbell, IconCalendar, IconTag, IconChart, IconPin,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const FEATURES = [
  { Icon: IconUsers, c: "blue", t: "Clienti & CRM", d: "Schede anagrafiche, stato onboarding, storico e assegnazione allo staff." },
  { Icon: IconDumbbell, c: "coral", t: "Schede di allenamento", d: "Carica le schede PDF: il cliente le trova sempre nella sua app." },
  { Icon: IconCalendar, c: "lime", t: "Calendario & classi", d: "Eventi singoli o ricorrenti, posti limitati, iscrizioni con un tap." },
  { Icon: IconTag, c: "cyan", t: "Piani & abbonamenti", d: "Crea i piani, assegnali ai clienti, limita gli eventi a una categoria." },
  { Icon: IconChart, c: "blue", t: "Progressi", d: "I tuoi clienti seguono allenamenti, traguardi e statistiche." },
  { Icon: IconPin, c: "coral", t: "Più sedi", d: "Gestisci diverse palestre sotto un unico account." },
];

const SHOWCASE = [
  { img: "/brand/illustration-workout-push.webp", t: "Schede in tasca", d: "Ogni cliente apre la sua scheda dal telefono." },
  { img: "/brand/illustration-progress-rings.webp", t: "Progressi vivi", d: "Anelli, streak e obiettivi che motivano." },
  { img: "/brand/illustration-nutrition-bowl.webp", t: "Tutto in un posto", d: "Allenamenti, classi e palestra, un'unica app." },
];

const STEPS = [
  { n: 1, t: "Crea la palestra", d: "Conferma l'email, imposta la password, attiva l'abbonamento." },
  { n: 2, t: "Invita i clienti", d: "Confermano via email — paghi solo i clienti confermati." },
  { n: 3, t: "Allena & monitora", d: "Carichi schede e classi; loro prenotano e seguono i progressi." },
];

const QUOTES = [
  { q: "In due settimane ho spostato tutta la gestione qui. I miei clienti adorano avere la scheda sul telefono.", who: "Marco R.", gym: "Iron Loft, Torino", c: "var(--blue)" },
  { q: "Le iscrizioni alle classi si gestiscono da sole. Niente più messaggi WhatsApp persi.", who: "Giulia P.", gym: "FlowFit Studio, Milano", c: "var(--coral)" },
  { q: "Pago solo per i clienti attivi. Per una palestra che cresce è perfetto.", who: "Dario M.", gym: "Atlas Gym, Bologna", c: "var(--cyan)" },
];

const FAQ = [
  { q: "Quando viene fatturato un cliente?", a: "Solo quando accetta l'invito e conferma: €0,50 una volta, poi nulla per quel cliente." },
  { q: "I clienti possono usarla sul telefono?", a: "Sì — è una web app che aprono dal browser e possono aggiungere alla home." },
  { q: "Posso disdire?", a: "Quando vuoi. Mantieni l'accesso fino alla fine del periodo." },
  { q: "Posso personalizzare il brand?", a: "Sì: tema, logo e banner della palestra appaiono nella vista dei tuoi clienti." },
];

export default async function PortalHome() {
  const host = headers().get("host");
  if (isAppHost(host)) redirect("/dashboard");

  const session = await auth();
  const loggedIn = !!session?.user;
  const onboarding = `${appBaseUrl()}/onboarding`;
  const login = `${appBaseUrl()}/login`;
  const appHome = `${appBaseUrl()}/dashboard`;

  return (
    <main>
      {/* Nav */}
      <nav className="lp-nav">
        <span className="brandrow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.webp" alt="BIG GYM" style={{ height: 34 }} />
          <span className="brandname" style={{ fontSize: "1.35rem" }}>
            BIG <span className="dot">GYM</span>
          </span>
        </span>
        <div className="row" style={{ gap: "0.6rem" }}>
          <a href="#features" className="muted" style={{ fontWeight: 600 }}>Funzioni</a>
          <a href="#pricing" className="muted" style={{ fontWeight: 600 }}>Prezzi</a>
          {loggedIn ? (
            <a href={appHome}><button className="primary" style={{ padding: "0.45rem 1.1rem" }}>Vai all&apos;app →</button></a>
          ) : (
            <>
              <a href={login} className="muted" style={{ fontWeight: 600 }}>Accedi</a>
              <a href="#pricing"><button className="primary" style={{ padding: "0.45rem 1.1rem" }}>Inizia</button></a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <span className="lp-eyebrow">Gestione palestra, fatta bene</span>
          <h1 className="lp-hero-h">
            Allena alla grande.<br />
            <span style={{ color: "var(--accent)" }}>Cresci più in grande.</span>
          </h1>
          <p className="lp-sub" style={{ fontSize: "1.15rem" }}>
            Clienti, schede, abbonamenti, classi e fatturazione — in un&apos;unica app
            brandizzata che i tuoi iscritti ameranno usare.
          </p>
          <div className="row" style={{ gap: "0.6rem" }}>
            <a href="#pricing"><button className="primary">Crea la tua palestra →</button></a>
            {loggedIn ? (
              <a href={appHome} className="muted" style={{ fontWeight: 600 }}>Vai alla tua app →</a>
            ) : (
              <a href={login} className="muted" style={{ fontWeight: 600 }}>Ho già un account</a>
            )}
          </div>
          <div className="lp-badges">
            <span className="lp-badge"><span className="d" /> Nessuna carta richiesta</span>
            <span className="lp-badge"><span className="d" /> €9/mese + €0,50/cliente</span>
            <span className="lp-badge"><span className="d" /> Disdici quando vuoi</span>
          </div>
        </div>
        <div className="lp-hero-art">
          <span className="blob" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/illustration-hero-lunge.webp" alt="Atleta in allenamento" />
        </div>
      </section>

      {/* Trust strip */}
      <div className="lp-strip">
        <div className="s"><b>1</b><span>app per palestra + clienti</span></div>
        <div className="s"><b>3</b><span>ruoli staff</span></div>
        <div className="s"><b>∞</b><span>clienti &amp; sedi</span></div>
        <div className="s"><b>€0,50</b><span>per cliente attivo</span></div>
      </div>

      {/* Features */}
      <h2 className="lp-section-title" id="features">Tutto in un posto solo</h2>
      <p className="lp-sub">Dalla prima anagrafica all&apos;ultima fattura, senza fogli di calcolo.</p>
      <div className="lp-grid">
        {FEATURES.map((f) => (
          <div className="card lp-feature" key={f.t}>
            <div className={`ic ${f.c}`}><f.Icon width={22} height={22} /></div>
            <h3 style={{ margin: "0.5rem 0 0.2rem" }}>{f.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{f.d}</p>
          </div>
        ))}
      </div>

      {/* Product showcase */}
      <h2 className="lp-section-title">Un&apos;app che i clienti aprono ogni giorno</h2>
      <p className="lp-sub">Brandizzata con la tua palestra. Mobile-first, dal calendario alle schede.</p>
      <div className="lp-showcase">
        {SHOWCASE.map((s) => (
          <div className="lp-shot" key={s.t}>
            <div className="pic">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt={s.t} />
            </div>
            <div className="cap">
              <h3>{s.t}</h3>
              <p className="muted" style={{ margin: 0 }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <h2 className="lp-section-title">Come funziona</h2>
      <div className="lp-steps">
        {STEPS.map((s) => (
          <div className="card lp-step" key={s.n}>
            <span className="n">{s.n}</span>
            <h3 style={{ margin: "0.5rem 0 0.2rem" }}>{s.t}</h3>
            <p className="muted" style={{ margin: 0 }}>{s.d}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <h2 className="lp-section-title">Scelto da palestre indipendenti</h2>
      <div className="lp-quotes">
        {QUOTES.map((t) => (
          <div className="card" key={t.who}>
            <p style={{ margin: 0 }}>“{t.q}”</p>
            <div className="who">
              <span className="lp-avatar" style={{ background: t.c }}>{t.who[0]}</span>
              <span>
                <strong>{t.who}</strong>
                <br />
                <span className="muted" style={{ fontSize: "0.85rem" }}>{t.gym}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing + sign-up CTA */}
      <h2 className="lp-section-title" id="pricing">Prezzo semplice</h2>
      <p className="lp-sub">Cresci senza sorprese: una sola fattura a fine mese.</p>
      <div className="lp-grid">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Paghi mentre cresci</p>
          <h2 style={{ margin: "0.2rem 0 0.1rem", fontSize: "2.6rem", fontFamily: "var(--font-display), sans-serif", fontWeight: 800 }}>
            €9<span style={{ fontSize: "1rem", fontWeight: 500 }}>/mese</span>
          </h2>
          <p style={{ margin: 0, fontWeight: 700 }}>+ €0,50 per cliente attivato</p>
          <p className="muted" style={{ margin: "0.4rem 0 0" }}>
            Un cliente conta solo quando conferma l&apos;invito via email. Nessun
            micro-addebito: tutto aggregato in una fattura.
          </p>
          <ul style={{ marginTop: "0.8rem" }}>
            <li>Staff &amp; clienti illimitati</li>
            <li>Ruoli: admin / reception / trainer</li>
            <li>Più sedi</li>
            <li>Disdici quando vuoi</li>
          </ul>
        </div>

        <form className="card accent" action={onboarding} method="get">
          <strong style={{ fontSize: "1.25rem" }}>Crea la tua palestra</strong>
          <p style={{ margin: "0.2rem 0 0.8rem", opacity: 0.85 }}>Bastano un paio di minuti.</p>
          <input
            name="name"
            placeholder="Nome della palestra"
            required
            style={{ width: "100%", background: "rgba(255,255,255,0.94)", color: "#111" }}
          />
          <button
            type="submit"
            style={{ width: "100%", marginTop: "0.6rem", background: "var(--accent-ink)", color: "var(--accent)", border: 0 }}
          >
            Inizia →
          </button>
          <p style={{ margin: "0.7rem 0 0", opacity: 0.85, fontSize: "0.85rem" }}>
            Se sei già loggato vai dritto al pagamento, altrimenti ti chiediamo di
            accedere prima.
          </p>
        </form>
      </div>

      {/* FAQ */}
      <h2 className="lp-section-title">Domande frequenti</h2>
      {FAQ.map((f) => (
        <div className="card" key={f.q}>
          <strong>{f.q}</strong>
          <p className="muted" style={{ margin: "0.3rem 0 0" }}>{f.a}</p>
        </div>
      ))}

      {/* Final CTA band */}
      <div className="lp-band">
        <h2>Porta la tua palestra al livello successivo</h2>
        <p>Crea l&apos;account in pochi minuti. Paga solo quando i clienti confermano.</p>
        <a href="#pricing"><button style={{ background: "var(--lime)", color: "var(--lime-ink)", border: 0, fontWeight: 800 }}>Inizia gratis →</button></a>
      </div>

      {/* Footer */}
      <footer>
        <div className="lp-foot-grid">
          <div>
            <span className="brandrow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-mark.webp" alt="BIG GYM" style={{ height: 30 }} />
              <span className="brandname" style={{ fontSize: "1.15rem" }}>BIG <span className="dot">GYM</span></span>
            </span>
            <p className="muted" style={{ margin: "0.6rem 0 0", maxWidth: 280 }}>
              La piattaforma all-in-one per palestre indipendenti.
            </p>
          </div>
          <div>
            <h4>Prodotto</h4>
            <a href="#features">Funzioni</a>
            <a href="#pricing">Prezzi</a>
            <a href={login}>Accedi</a>
          </div>
          <div>
            <h4>Inizia</h4>
            <a href="#pricing">Crea la palestra</a>
            <a href={appHome}>Vai all&apos;app</a>
          </div>
        </div>
        <p className="muted" style={{ textAlign: "center", padding: "0 0 1.4rem" }}>
          BIG GYM © {new Date().getFullYear()} · Train Big. Live Bigger.
        </p>
      </footer>
    </main>
  );
}
