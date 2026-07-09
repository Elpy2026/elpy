import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ShieldCheck,
  Lock,
  MessageCircle,
  MapPin,
  Star,
  LifeBuoy,
  ArrowRight,
  Menu,
  X,
  Plus,
  Minus,
  Instagram,
  Facebook,
  Heart,
  Sparkles,
  Check,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import furnitureImg from "@/assets/help-furniture.jpg";
import dogImg from "@/assets/dog-sitter.jpg";
import techImg from "@/assets/tech-help.jpg";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ELPYO",
          description:
            "Community italiana che mette in contatto persone che hanno bisogno di una mano con persone disponibili ad aiutare.",
          areaServed: "IT",
        }),
      },
    ],
  }),
});

/* --------------------------------- LOGO ---------------------------------- */
function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="ELPYO"
      className={className}
      draggable={false}
    />
  );
}

/* -------------------------------- HEADER --------------------------------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#come-funziona", label: "Come funziona" },
    { href: "#perche", label: "Perché ELPYO" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/80 border-b border-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 min-h-24 py-5">
        <a href="#top" className="flex items-center gap-2 shrink-0">
          <Logo className="w-36 sm:w-44 h-auto" />
        </a>
        <nav className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] font-medium text-charcoal hover:text-coral transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <a href="#community" className="btn-primary">
            Entra nella community
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <button
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-soft border border-black/5"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden mx-4 mb-3 rounded-3xl bg-white shadow-elevated border border-black/5 p-6 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-charcoal"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#community"
            onClick={() => setOpen(false)}
            className="btn-primary justify-center mt-2"
          >
            Entra nella community
          </a>
        </div>
      )}
    </header>
  );
}

/* --------------------------------- HERO ---------------------------------- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 sm:pt-40 pb-20 sm:pb-28">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-peach blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-lavender blur-3xl opacity-70" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-black/5 shadow-soft pl-2 pr-4 py-1.5 mb-8">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full gradient-coral">
              <Heart className="h-3.5 w-3.5 text-white" fill="currentColor" />
            </span>
            <span className="text-[13px] font-medium text-charcoal">
              La community italiana dell'aiuto reciproco
            </span>
          </div>

          <h1 className="font-display font-bold tracking-tight text-navy text-[42px] sm:text-6xl lg:text-[68px] leading-[1.05]">
            Nessuno dovrebbe{" "}
            <span className="text-gradient-coral">affrontare la quotidianità</span>{" "}
            da solo.
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-gray-brand leading-relaxed max-w-xl">
            ELPYO mette in contatto persone che cercano una mano con persone disponibili
            ad aiutare nella propria città. Puoi <strong className="text-charcoal font-semibold">trovare aiuto</strong> oppure{" "}
            <strong className="text-charcoal font-semibold">guadagnare aiutando</strong> gli altri.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a href="#community" className="btn-primary btn-lg">
              Entra nella community
              <ArrowRight className="h-5 w-5" />
            </a>
            <a href="#come-funziona" className="btn-ghost btn-lg">
              Scopri come funziona
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              <span className="h-9 w-9 rounded-full gradient-coral ring-2 ring-white" />
              <span className="h-9 w-9 rounded-full gradient-violet ring-2 ring-white" />
              <span className="h-9 w-9 rounded-full bg-peach ring-2 ring-white" />
              <span className="h-9 w-9 rounded-full bg-lavender ring-2 ring-white" />
            </div>
            <p className="text-sm text-gray-brand">
              <span className="font-semibold text-charcoal">743</span> persone hanno già scelto ELPYO.
            </p>
          </div>
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="relative rounded-[36px] overflow-hidden shadow-elevated">
            <img
              src={heroImg}
              alt="Una ragazza aiuta una signora a portare la spesa in casa"
              width={1536}
              height={1280}
              className="w-full h-[520px] sm:h-[620px] object-cover"
            />
          </div>

          {/* Floating cards */}
          <div className="absolute -left-4 sm:-left-10 top-10 rounded-2xl bg-white/95 backdrop-blur shadow-elevated border border-black/5 p-4 flex items-center gap-3 animate-float-slow">
            <span className="h-10 w-10 rounded-xl gradient-coral inline-flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-navy leading-tight">Persone verificate</p>
              <p className="text-xs text-gray-brand">Identità confermata</p>
            </div>
          </div>

          <div
            className="absolute -right-3 sm:-right-6 bottom-10 rounded-2xl bg-white/95 backdrop-blur shadow-elevated border border-black/5 p-4 flex items-center gap-3 animate-float-slow"
            style={{ animationDelay: "1.5s" }}
          >
            <span className="h-10 w-10 rounded-xl bg-lavender inline-flex items-center justify-center">
              <Star className="h-5 w-5 text-violet" fill="currentColor" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-navy leading-tight">4.9 · Recensioni reali</p>
              <p className="text-xs text-gray-brand">Dalla community</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- HOW IT WORKS ------------------------------ */
const steps = [
  {
    n: "01",
    title: "Pubblica una richiesta",
    text: "Racconta di cosa hai bisogno in pochi secondi: spesa, dog sitter, un montaggio, un accompagnamento. Bastano poche righe.",
  },
  {
    n: "02",
    title: "Trova una persona disponibile",
    text: "Ricevi proposte da persone vicino a te, verificate e recensite. Scegli con chi ti trovi meglio.",
  },
  {
    n: "03",
    title: "Aiutatevi in sicurezza",
    text: "Chat integrata, pagamenti protetti e recensioni: tutto quello che serve per fidarti fin dal primo minuto.",
  },
];

function HowItWorks() {
  return (
    <section id="come-funziona" className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Come funziona"
          title="Chiedere e offrire aiuto, in tre passi."
          subtitle="Semplice come mandare un messaggio a un amico. Ma con la sicurezza di una vera community."
        />

        <div className="mt-16 grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="group relative rounded-3xl bg-white border border-black/5 p-8 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-sm font-semibold text-coral">{s.n}</span>
              <h3 className="mt-3 text-2xl font-bold text-navy leading-tight">{s.title}</h3>
              <p className="mt-4 text-gray-brand leading-relaxed">{s.text}</p>
              <div className="mt-8 h-1 w-12 rounded-full gradient-coral opacity-70 group-hover:w-20 transition-all duration-300" />
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-5 top-10 h-6 w-6 text-coral/40" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- SHOWCASE ------------------------------- */
function Showcase() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid md:grid-cols-12 gap-5 sm:gap-6">
        <ShowcaseCard
          img={furnitureImg}
          tag="Piccole commissioni"
          title="Un montaggio, un trasloco, un favore."
          className="md:col-span-7 h-[380px] sm:h-[460px]"
        />
        <ShowcaseCard
          img={dogImg}
          tag="Dog sitter"
          title="Il tuo cane in buone mani."
          className="md:col-span-5 h-[380px] sm:h-[460px]"
        />
        <ShowcaseCard
          img={techImg}
          tag="Supporto tecnologico"
          title="Un aiuto pratico, di persona."
          className="md:col-span-12 h-[380px] sm:h-[460px]"
        />
      </div>
    </section>
  );
}

function ShowcaseCard({
  img,
  tag,
  title,
  className = "",
}: {
  img: string;
  tag: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] group ${className}`}
    >
      <img
        src={img}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-white/90 bg-white/15 backdrop-blur px-3 py-1 rounded-full border border-white/20">
          {tag}
        </span>
        <h3 className="mt-4 text-2xl sm:text-3xl font-bold text-white leading-tight max-w-md">
          {title}
        </h3>
      </div>
    </div>
  );
}

/* --------------------------------- WHY ---------------------------------- */
const perks = [
  {
    icon: ShieldCheck,
    title: "Persone verificate",
    text: "Ogni profilo passa da un processo di verifica dell'identità.",
    tint: "coral",
  },
  {
    icon: Lock,
    title: "Pagamenti sicuri",
    text: "I pagamenti sono protetti e vengono rilasciati solo a servizio completato.",
    tint: "violet",
  },
  {
    icon: MessageCircle,
    title: "Chat integrata",
    text: "Parla direttamente nell'app, senza scambiare numeri o email.",
    tint: "coral",
  },
  {
    icon: MapPin,
    title: "Community locale",
    text: "Trova solo persone del tuo quartiere o della tua città.",
    tint: "violet",
  },
  {
    icon: Star,
    title: "Recensioni reali",
    text: "Ogni aiuto lascia una traccia: leggi cosa dicono di te e degli altri.",
    tint: "coral",
  },
  {
    icon: LifeBuoy,
    title: "Supporto umano",
    text: "Un team pronto ad ascoltarti, in italiano, quando serve.",
    tint: "violet",
  },
];

function Why() {
  return (
    <section id="perche" className="py-24 sm:py-32 bg-light-gray/60">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Perché ELPYO"
          title="Una community pensata per fidarsi."
          subtitle="Non un marketplace freddo. Un posto dove le persone si prendono cura le une delle altre, davvero."
        />
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {perks.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group rounded-3xl bg-white border border-black/5 p-8 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              >
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
                    p.tint === "coral" ? "gradient-coral" : "gradient-violet"
                  } shadow-soft`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-navy">{p.title}</h3>
                <p className="mt-3 text-gray-brand leading-relaxed">{p.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- COMMUNITY ------------------------------- */
function Community() {
  const current = 743;
  const goal = 1000;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const formatIt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <section id="community" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 right-0 h-96 w-96 rounded-full bg-peach blur-3xl opacity-60" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-96 w-96 rounded-full bg-lavender blur-3xl opacity-60" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-black/5 shadow-soft px-4 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-coral" />
              <span className="text-[13px] font-medium text-charcoal">
                Stiamo aprendo le porte
              </span>
            </div>
            <h2 className="font-display font-bold text-navy text-4xl sm:text-5xl lg:text-[56px] leading-[1.05]">
              Stiamo costruendo la{" "}
              <span className="text-gradient-coral">community ELPYO</span>.
            </h2>
            <p className="mt-6 text-lg text-gray-brand leading-relaxed">
              Apriremo ufficialmente ELPYO quando la community avrà raggiunto un numero
              sufficiente di iscritti per offrire un'esperienza davvero utile fin dal
              primo giorno.
            </p>
            <p className="mt-4 text-lg text-gray-brand leading-relaxed">
              Se vuoi essere tra i primi utenti,{" "}
              <strong className="text-charcoal font-semibold">
                entra oggi nella community
              </strong>
              .
            </p>

            <div className="mt-10 rounded-3xl bg-white border border-black/5 shadow-soft p-6 sm:p-8">
              <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-gray-brand font-medium">Membri iscritti</p>
                <p className="mt-1 font-bold text-navy text-3xl sm:text-4xl">
                  {formatIt(current)}{" "}
                  <span className="text-gray-brand font-medium text-xl">
                    / {formatIt(goal)}
                  </span>
                </p>
              </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-peach px-3 py-1.5 text-sm font-semibold text-coral">
                  {pct}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-light-gray overflow-hidden">
                <div
                  className="h-full rounded-full gradient-coral transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-brand">
                Ancora <strong className="text-charcoal">{goal - current}</strong> posti prima dell'apertura ufficiale.
              </p>
            </div>
          </div>

          <SignupForm />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- FORM ---------------------------------- */
function SignupForm() {
  const [state, setState] = useState<{
    nome: string;
    email: string;
    cap: string;
    citta: string;
    privacy: boolean;
  }>({ nome: "", email: "", cap: "", citta: "", privacy: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!state.privacy) {
      setError("Accetta la privacy per continuare.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase
      .from("community_waitlist")
      .insert({
        name: state.nome.trim(),
        email: state.email.trim().toLowerCase(),
        city: state.citta.trim(),
        postal_code: state.cap.trim(),
        privacy_accepted: state.privacy,
        source: "landing",
      });

    setSubmitting(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Questa email è già presente nella community ELPYO.");
        return;
      }

      setError("Non siamo riusciti a salvare l'iscrizione. Riprova tra poco.");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-[32px] bg-white border border-black/5 shadow-elevated p-8 sm:p-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-coral shadow-card">
          <Check className="h-8 w-8 text-white" />
        </span>
        <h3 className="mt-6 text-2xl sm:text-3xl font-bold text-navy">
          Benvenutə nella community, {state.nome || "ciao"}!
        </h3>
        <p className="mt-4 text-gray-brand leading-relaxed">
          Ti scriveremo appena ELPYO aprirà ufficialmente nella tua zona.
          Sarai tra i primi a entrare.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[32px] bg-white border border-black/5 shadow-elevated p-7 sm:p-9"
    >
      <h3 className="text-2xl sm:text-3xl font-bold text-navy">
        Entra nella community.
      </h3>
      <p className="mt-2 text-gray-brand">
        Nessun impegno. Zero spam. Solo aggiornamenti quando serve.
      </p>

      <div className="mt-7 space-y-4">
        <Field label="Nome" name="nome" value={state.nome} onChange={(v) => setState({ ...state, nome: v })} required placeholder="Il tuo nome" />
        <Field label="Email" name="email" type="email" value={state.email} onChange={(v) => setState({ ...state, email: v })} required placeholder="tu@esempio.it" />
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Field label="CAP" name="cap" value={state.cap} onChange={(v) => setState({ ...state, cap: v })} required placeholder="00100" inputMode="numeric" maxLength={5} />
          <Field label="Città" name="citta" value={state.citta} onChange={(v) => setState({ ...state, citta: v })} required placeholder="Roma" />
        </div>

        <label className="flex items-start gap-3 pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.privacy}
            onChange={(e) => setState({ ...state, privacy: e.target.checked })}
            className="mt-1 h-5 w-5 rounded-md border-2 border-black/10 text-coral focus:ring-coral accent-coral cursor-pointer"
          />
          <span className="text-sm text-gray-brand leading-relaxed">
            Ho letto e accetto la{" "}
            <a href="#" className="text-coral font-semibold hover:underline">
              Privacy Policy
            </a>{" "}
            e acconsento al trattamento dei miei dati.
          </span>
        </label>

        {error && (
          <p className="text-sm font-medium text-coral">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary btn-lg w-full justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? "Invio in corso..." : "Entra nella community"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "email";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-charcoal">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="mt-1.5 w-full rounded-2xl border border-black/10 bg-light-gray/40 px-4 py-3.5 text-[15px] text-navy placeholder:text-gray-brand/70 outline-none focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10 transition-all"
      />
    </label>
  );
}

/* --------------------------------- FAQ ---------------------------------- */
const faqs = [
  {
    q: "Cos'è ELPYO?",
    a: "ELPYO è una community italiana che mette in contatto persone che hanno bisogno di una mano con persone disponibili ad aiutare, nella propria città.",
  },
  {
    q: "Costa qualcosa iscriversi?",
    a: "No. Iscriversi alla community è gratuito. Al lancio pagherai solo per i servizi che riceverai, tramite pagamenti sicuri all'interno dell'app.",
  },
  {
    q: "Come vengono verificate le persone?",
    a: "Ogni utente passa da un processo di verifica dell'identità. Recensioni e valutazioni completano la fiducia nella community.",
  },
  {
    q: "Posso guadagnare aiutando gli altri?",
    a: "Sì. Puoi offrire il tuo tempo e le tue competenze per aiutare le persone vicino a te ed essere retribuito in modo trasparente.",
  },
  {
    q: "Quando aprirà ufficialmente ELPYO?",
    a: "Apriremo quando la community avrà raggiunto un numero sufficiente di iscritti nella tua zona per garantire un'esperienza davvero utile fin dal primo giorno.",
  },
  {
    q: "Come vengono trattati i miei dati?",
    a: "Rispettiamo il GDPR. Usiamo i tuoi dati solo per gestire la tua iscrizione e comunicarti l'apertura di ELPYO. Puoi cancellarti in qualsiasi momento.",
  },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Domande frequenti"
          title="Tutto quello che ti serve sapere."
          subtitle="Non trovi la risposta? Scrivici, ti rispondiamo di persona."
          center
        />
        <div className="mt-14 divide-y divide-black/5 rounded-3xl bg-white border border-black/5 shadow-soft overflow-hidden">
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full flex items-center justify-between gap-6 text-left px-6 sm:px-8 py-6 hover:bg-light-gray/40 transition-colors"
                >
                  <span className="font-semibold text-navy text-lg">{f.q}</span>
                  <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-peach text-coral">
                    {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 sm:px-8 pb-6 text-gray-brand leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- CTA ---------------------------------- */
function BigCTA() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] gradient-coral px-8 sm:px-16 py-16 sm:py-24 text-center shadow-elevated">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative font-display font-bold text-white text-3xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl mx-auto">
            Costruiamo insieme una community più vicina.
          </h2>
          <p className="relative mt-6 text-white/90 text-lg max-w-xl mx-auto">
            Un aiuto oggi, un aiuto domani. È così che ELPYO cresce.
          </p>
          <a href="#community" className="relative mt-10 inline-flex items-center gap-2 rounded-full bg-white text-coral font-semibold px-7 py-4 shadow-soft hover:-translate-y-0.5 transition-all">
            Entra nella community
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FOOTER --------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="flex items-center gap-4">
          <Logo className="w-32 sm:w-40 h-auto" />
          <span className="text-sm text-gray-brand">
            © {new Date().getFullYear()} ELPYO
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-gray-brand">
          <a href="#" className="hover:text-coral transition-colors">Privacy</a>
          <a href="#" className="hover:text-coral transition-colors">Cookie</a>
          <a href="#" className="hover:text-coral transition-colors">Contatti</a>
        </nav>
        <div className="flex items-center gap-2">
          <SocialIcon href="#" label="Instagram"><Instagram className="h-4 w-4" /></SocialIcon>
          <SocialIcon href="#" label="Facebook"><Facebook className="h-4 w-4" /></SocialIcon>
          <SocialIcon href="#" label="TikTok"><TikTokIcon /></SocialIcon>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-light-gray text-charcoal hover:bg-coral hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.3v6.3a6.5 6.5 0 1 1-6.5-6.5c.34 0 .67.03 1 .09v3.1a3.5 3.5 0 1 0 2.5 3.36V3h3z"/>
    </svg>
  );
}

/* ------------------------------- SECTION HEADER -------------------------- */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <span className="text-sm font-semibold uppercase tracking-widest text-coral">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display font-bold text-navy text-4xl sm:text-5xl leading-[1.05]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-lg text-gray-brand leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

/* ------------------------------ SCROLL FADE ------------------------------ */
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const els = el.querySelectorAll<HTMLElement>("[data-reveal]");
    els.forEach((n) => {
      n.style.opacity = "0";
      n.style.transform = "translateY(24px)";
      n.style.transition = "opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1)";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* --------------------------------- PAGE ---------------------------------- */
function Landing() {
  const ref = useRevealOnScroll();
  return (
    <div ref={ref} className="min-h-screen bg-white text-navy antialiased">
      <Header />
      <main>
        <Hero />
        <div data-reveal><HowItWorks /></div>
        <div data-reveal><Showcase /></div>
        <div data-reveal><Why /></div>
        <div data-reveal><Community /></div>
        <div data-reveal><FAQ /></div>
        <div data-reveal><BigCTA /></div>
      </main>
      <Footer />
    </div>
  );
}

