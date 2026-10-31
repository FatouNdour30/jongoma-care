import Link from "next/link";
import { DonneesExemple } from "@/components/DonneesExemple";
import { Ecouter } from "@/components/Ecouter";
import { Icone } from "@/components/Icone";
import { Photo } from "@/components/Photo";
import { db } from "@/lib/db";
import { ACCUEIL } from "@/lib/i18n/accueil";
import { actions, programmes } from "@/lib/i18n/programmes";
import { getLangue } from "@/lib/langue";
import { indicateurs } from "@/lib/opendata";
import { PHOTOS } from "@/lib/photos";

function Section({ id, surtitre, titre, sous, children }: { id?: string; surtitre: string; titre: string; sous?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{surtitre}</p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{titre}</h2>
      {sous && <p className="mt-3 max-w-2xl text-lg text-muted">{sous}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function CarteRappel({ rappel, consultation, quand }: { rappel: string; consultation: string; quand: string }) {
  return (
    <div className="w-60 rounded-2xl bg-card/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur" aria-hidden>
      <div className="flex items-center gap-2 text-xs font-semibold text-brand">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-soft"><Icone nom="calendrier" className="size-3.5" /></span>
        {rappel}
      </div>
      <p className="mt-2 text-sm font-semibold">{consultation}</p>
      <p className="text-xs text-muted">{quand}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[10px] text-white">▶</span>
        <span className="flex h-6 flex-1 items-end gap-[3px]">
          {[40, 70, 55, 90, 60, 80, 45, 75, 50, 65, 35, 55].map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-brand/60" style={{ height: `${h}%` }} />
          ))}
        </span>
      </div>
    </div>
  );
}

// Couleurs des trois colonnes « objectivement » : fonctionne / prévu / ne fait pas.
const COLONNE = {
  vert: { cadre: "border-emerald-200 bg-emerald-50/50", puce: "text-emerald-600", signe: "✓", pastille: "bg-emerald-600" },
  bleu: { cadre: "border-sky-200 bg-sky-50/50", puce: "text-sky-600", signe: "→", pastille: "bg-sky-600" },
  gris: { cadre: "border-stone-200 bg-stone-50", puce: "text-stone-500", signe: "✕", pastille: "bg-stone-500" },
} as const;

export default async function Accueil() {
  const langue = await getLangue();
  const c = ACCUEIL[langue];
  const { total } = indicateurs(db());
  const chiffres = [total.inscrites ?? "—", total.avecReferente !== null ? `${total.avecReferente} %` : "—", total.rdvHonores !== null ? `${total.rdvHonores} %` : "—", total.continuitePostnatale !== null ? `${total.continuitePostnatale} %` : "—"];
  const progs = programmes(langue);
  const acts = actions(langue);

  return (
    <div className="space-y-24 pb-8">
      {/* Présentation */}
      <section className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 bg-gradient-to-b from-brand-soft/50 to-background pb-6 pt-10 sm:pt-14">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold text-brand shadow-sm ring-1 ring-black/5">
              <span className="size-1.5 rounded-full bg-accent" /> {c.hero.badge}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-[3.4rem]">
              {c.hero.titre1}<em className="font-medium text-brand">{c.hero.titre2}</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{c.hero.texte}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/connexion" className="btn px-6 py-3 text-base shadow-lg shadow-brand/20">{c.hero.demo}</Link>
              <Link href="/inscription" className="btn-sec px-6 py-3 text-base">{c.hero.inscrire}</Link>
              <Ecouter texte={c.intro} libelle={c.hero.ecouter} langue={langue} />
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-5 text-sm">
              {c.hero.faits.map(([t, d]) => (
                <div key={t}><dt className="text-muted">{t}</dt><dd className="font-semibold">{d}</dd></div>
              ))}
            </dl>
          </div>
          <div className="relative pb-10 md:pb-0">
            <Photo photo={PHOTOS.mereNouveauNe} priority sizes="(min-width: 768px) 480px, 100vw" className="aspect-[4/5] rounded-[2rem] shadow-2xl ring-1 ring-black/5" />
            <div className="absolute -bottom-2 left-3 md:-left-10 md:bottom-10">
              <CarteRappel rappel={c.hero.rappel} consultation={c.hero.consultation} quand={c.hero.quand} />
            </div>
            <div className="absolute right-3 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold shadow-lg ring-1 ring-black/5 md:-right-4">
              <span className="text-brand">●</span> {c.hero.referente}
            </div>
          </div>
        </div>
      </section>

      {/* Ce que fait la plateforme, objectivement */}
      <Section id="objectivement" surtitre={c.objectif.surtitre} titre={c.objectif.titre} sous={c.objectif.sous}>
        <div className="grid gap-4 lg:grid-cols-3">
          {c.objectif.colonnes.map((col) => {
            const s = COLONNE[col.ton as keyof typeof COLONNE];
            return (
              <div key={col.titre} className={`rounded-2xl border p-6 ${s.cadre}`}>
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <span className={`size-2.5 rounded-full ${s.pastille}`} aria-hidden />
                  {col.titre}
                  <span className="ml-auto rounded-full bg-card px-2 text-xs font-bold tabular-nums text-muted ring-1 ring-border">{col.points.length}</span>
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span className={`mt-px shrink-0 font-bold ${s.puce}`} aria-hidden>{s.signe}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Conçu pour */}
      <section className="grid items-center gap-10 md:grid-cols-[1fr_1.1fr]">
        <Photo photo={PHOTOS.femmeCommerce} className="aspect-[4/3] rounded-[2rem] shadow-xl" sizes="(min-width: 768px) 460px, 100vw" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{c.concu.surtitre}</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{c.concu.titre}</h2>
          <p className="mt-3 text-lg text-muted">{c.concu.sous}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {c.concu.items.map((x) => (
              <div key={x.titre} className="flex gap-3">
                <span className="h-fit rounded-xl bg-brand-soft p-2 text-brand"><Icone nom={x.icone} className="size-5" /></span>
                <div>
                  <h3 className="font-semibold">{x.titre}</h3>
                  <p className="text-sm text-muted">{x.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problème */}
      <Section surtitre={c.probleme.surtitre} titre={c.probleme.titre} sous={c.probleme.sous}>
        <div className="grid gap-4 sm:grid-cols-2">
          {c.probleme.items.map((p, i) => (
            <div key={p.titre} className="card flex gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="font-display text-4xl font-semibold text-accent/50">0{i + 1}</span>
              <div>
                <h3 className="font-semibold">{p.titre}</h3>
                <p className="mt-1 text-sm text-muted">{p.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Les 1 000 premiers jours : un parcours continu mère-bébé */}
      <Section id="mille-jours" surtitre={c.mille.surtitre} titre={c.mille.titre} sous={c.mille.sous}>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.mille.etapes.map((e, i) => (
            <li key={e.titre} className="card">
              <span className="font-display text-3xl font-semibold text-accent/60">{i + 1}</span>
              <h3 className="mt-1 font-semibold">{e.titre}</h3>
              <p className="mt-1 text-sm text-muted">{e.texte}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-brand text-left text-white">
              <tr>{c.mille.double.titres.map((x) => <th key={x} className="px-4 py-2.5 font-semibold">{x}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {c.mille.double.lignes.map(([m, b]) => <tr key={m}><td className="px-4 py-2">{m}</td><td className="px-4 py-2">{b}</td></tr>)}
            </tbody>
          </table>
        </div>
        <figure className="mt-8 text-center">
          <blockquote className="font-display text-2xl font-semibold italic text-brand sm:text-3xl">« {c.mille.promesse} »</blockquote>
          {c.mille.promesseTraduite && <figcaption className="mt-2 text-sm text-muted">{c.mille.promesseTraduite}</figcaption>}
        </figure>
        <p className="mt-4 text-xs text-muted">{c.mille.note}</p>
      </Section>

      {/* Jeunes filles */}
      <Section id="jeunes-filles" surtitre={c.jeunes.surtitre} titre={c.jeunes.titre} sous={c.jeunes.sous}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.jeunes.items.map((x) => (
            <div key={x.titre} className="card">
              <span className="inline-flex rounded-xl bg-brand-soft p-2 text-brand"><Icone nom={x.icone} className="size-5" /></span>
              <h3 className="mt-3 font-semibold">{x.titre}</h3>
              <p className="mt-1 text-sm text-muted">{x.texte}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">{c.jeunes.note}</p>
      </Section>

      {/* Parcours */}
      <Section surtitre={c.solution.surtitre} titre={c.solution.titre} sous={c.solution.sous}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Photo photo={PHOTOS.sageFemme} legende={c.solution.legende1} className="aspect-[16/10] rounded-3xl" />
          <Photo photo={PHOTOS.mereBebe} legende={c.solution.legende2} className="aspect-[16/10] rounded-3xl" />
        </div>
        <ol className="grid gap-4 md:grid-cols-5">
          {c.solution.etapes.map((p, i) => (
            <li key={p.etape} className="relative rounded-2xl border border-border bg-card p-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{p.etape}</h3>
              <p className="mt-1 text-sm text-muted">{p.texte}</p>
              {i < c.solution.etapes.length - 1 && <span className="absolute -right-3 top-8 hidden text-xl text-brand md:block" aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </Section>

      {/* Programmes de santé */}
      <Section id="programmes" surtitre={c.programmes.surtitre} titre={c.programmes.titre} sous={c.programmes.sous}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {progs.map((pg) => (
            <article key={pg.id} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="font-semibold leading-snug">{pg.nom}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{pg.pourquoi}</p>
              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                {acts.filter((a) => a.programme === pg.id).map((a) => (
                  <li key={a.id} className="flex gap-1.5"><span className="text-brand">✓</span>{a.libelle}</li>
                ))}
              </ul>
            </article>
          ))}
          <article className="card flex flex-col justify-center bg-brand-soft/40">
            <h3 className="font-semibold">{c.programmes.confidentialiteTitre}</h3>
            <p className="mt-2 text-sm text-muted">{c.programmes.confidentialite}</p>
          </article>
        </div>
      </Section>

      {/* Fonctionnalités */}
      <Section id="fonctionnalites" surtitre={c.espaces.surtitre} titre={c.espaces.titre} sous={c.espaces.sous}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.espaces.items.map((e) => (
            <article key={e.titre} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="w-fit rounded-xl bg-brand-soft p-2.5 text-brand"><Icone nom={e.icone} /></span>
              <h3 className="mt-3 text-lg font-semibold">{e.titre}</h3>
              <p className="text-xs text-muted">{e.pour}</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                {e.points.map((p) => (
                  <li key={p} className="flex gap-2"><span className="text-brand">✓</span>{p}</li>
                ))}
              </ul>
              <Link href={e.href} className="mt-4 text-sm font-semibold text-brand hover:underline">{e.cta} →</Link>
            </article>
          ))}
        </div>
      </Section>

      {/* Communauté */}
      <section className="rounded-[2rem] bg-stone-900 px-6 py-14 text-white sm:px-10">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="grid grid-cols-5 gap-3">
            <Photo photo={PHOTOS.femmeChamp} className="col-span-3 aspect-[3/4] rounded-3xl" sizes="(min-width: 768px) 280px, 60vw" />
            <Photo photo={PHOTOS.famille} className="col-span-2 mt-12 aspect-[3/4] rounded-3xl" sizes="(min-width: 768px) 190px, 40vw" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">{c.communaute.surtitre}</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{c.communaute.titre}</h2>
            <p className="mt-4 text-lg text-white/75">{c.communaute.texte}</p>
            <ul className="mt-6 space-y-2 text-white/85">
              {c.communaute.points.map((x) => (
                <li key={x} className="flex gap-2"><span className="text-orange-300">✓</span>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <Section surtitre={c.technos.surtitre} titre={c.technos.titre} sous={c.technos.sous}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.technos.items.map((t) => (
            <div key={t.titre} className="card">
              <div className="flex items-start justify-between">
                <span className="text-brand"><Icone nom={t.icone} className="size-7" /></span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.statut === "demo" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
                  {t.statut === "demo" ? c.technos.demo : c.technos.prevu}
                </span>
              </div>
              <h3 className="mt-3 font-semibold">{t.titre}</h3>
              <p className="mt-1 text-sm text-muted">{t.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Données ouvertes */}
      <Section surtitre={c.donnees.surtitre} titre={c.donnees.titre} sous={c.donnees.sous}>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white sm:p-10">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
          <div className="absolute -bottom-24 right-24 size-48 rounded-full bg-accent/30" aria-hidden />
          <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
            {chiffres.map((v, i) => (
              <div key={c.donnees.libelles[i]}>
                <div className="font-display text-5xl font-semibold tabular-nums">{v}</div>
                <div className="mt-1 text-sm text-white/80">{c.donnees.libelles[i]}</div>
              </div>
            ))}
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href="/donnees" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand">{c.donnees.voir}</Link>
            <a href="/api/donnees" className="rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold">{c.donnees.csv}</a>
          </div>
          <p className="relative mt-4 flex flex-wrap items-center gap-3 text-xs text-white/70"><DonneesExemple clair /> {c.donnees.masque}</p>
        </div>
      </Section>

      {/* Confiance */}
      <Section surtitre={c.confiance.surtitre} titre={c.confiance.titre}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.confiance.principes.map((p) => (
            <div key={p} className="flex gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <span className="text-brand"><Icone nom="bouclier" className="size-5" /></span>
              {p}
            </div>
          ))}
        </div>
      </Section>

      {/* Open source + appel final */}
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand to-encre text-white">
        <div className="grid items-center md:grid-cols-[1.4fr_1fr]">
          <div className="p-8 sm:p-10">
            <span className="inline-flex rounded-xl bg-white/10 p-3"><Icone nom="code" /></span>
            <h2 className="mt-4 text-3xl font-semibold">{c.openSource.titre}</h2>
            <p className="mt-3 max-w-xl text-white/80">{c.openSource.texte}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/connexion" className="rounded-xl bg-white px-5 py-3 font-semibold text-brand">{c.openSource.demo}</Link>
              <Link href="/a-propos" className="rounded-xl border border-white/40 px-5 py-3 font-semibold">{c.openSource.plus}</Link>
            </div>
          </div>
          <Photo photo={PHOTOS.centreDeSante} className="hidden h-full min-h-72 md:block" sizes="400px" />
        </div>
      </section>
    </div>
  );
}
