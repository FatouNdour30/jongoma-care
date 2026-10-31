import type { ReactNode } from "react";
import Link from "next/link";
import { Icone, type NomIcone } from "@/components/Icone";
import { Photo } from "@/components/Photo";
import { Titre } from "@/components/ui";
import { getLangue } from "@/lib/langue";
import { SEUIL_MIN } from "@/lib/opendata";
import { PHOTOS } from "@/lib/photos";
import { REGLES } from "@/lib/priority";
import { ZONES } from "@/lib/types";

const REGLES_EN: Record<string, string> = {
  manque: "Missed appointment in the last 60 days (per appointment, max. 2)",
  rappels: "2 or more unanswered reminders",
  contact: "No contact for more than 14 days",
  distance: "Facility more than 10 km away",
  fin: "36 weeks or more with no appointment scheduled",
  postnatal: "Postnatal with no visit scheduled or attended",
  verifier: "Past appointment to verify",
  prevention: "Prevention or screening overdue (malaria, anaemia, tetanus, screenings offered; mental health excluded)",
  vaccin: "Baby vaccine more than 14 days overdue (indicative schedule)",
};

type Carte = { icone: NomIcone; titre: string; texte: string };

const T = {
  fr: {
    titre: "À propos de Jongoma Care",
    sous: "Plateforme open source développée par Jongoma Tech (Sénégal).",
    faitTitre: "Ce que fait la plateforme",
    fait: "Chaque femme inscrite et consentante a une référente principale qui l'accompagne de l'inscription au postnatal. Les rappels, l'audio, le répertoire vérifié et le suivi de la prévention l'aident à accéder aux soins. La plateforme ne pose aucun diagnostic.",
    chiffres: [
      { valeur: String(ZONES.length), libelle: "zones d'intervention" },
      { valeur: "4", libelle: "consentements séparés et révocables" },
      { valeur: "5", libelle: "étapes, de l'inscription au postnatal" },
      { valeur: "2", libelle: "langues : wolof et français" },
    ],
    engagementsTitre: "Nos engagements",
    engagementsSous: "Des règles inscrites dans le code, pas seulement dans une charte.",
    engagements: [
      { icone: "cadenas", titre: "Le consentement d'abord", texte: "Service, rappels, accompagnement et aide de l'ordinateur sont acceptés séparément. Chaque accord peut être retiré à tout moment, sans perdre le reste du service." },
      { icone: "bouclier", titre: "Chacun ne voit que ce qui le concerne", texte: "Une référente voit ses bénéficiaires, une spécialiste les seules orientations acceptées, un établissement les seules demandes qui lui sont adressées." },
      { icone: "personne", titre: "Identité séparée du suivi", texte: "Le nom et le téléphone sont stockés à part. Le suivi et le journal d'audit ne contiennent que des identifiants, jamais de résultat d'examen." },
      { icone: "etincelle", titre: "Une IA explicable et refusable", texte: "Le score de priorisation est une liste de règles publiques. Il organise les appels, il ne refuse jamais un service. Chaque femme peut s'y opposer." },
      { icone: "hopital", titre: "Seule la structure confirme", texte: "Aucun rendez-vous n'est confirmé automatiquement : c'est l'établissement de santé qui le valide." },
      { icone: "graphique", titre: "Des données ouvertes, mais anonymes", texte: `Les indicateurs publics sont agrégés par zone. Toute valeur calculée sur moins de ${SEUIL_MIN} personnes est masquée.` },
    ] as Carte[],
    zonesTitre: "Où nous intervenons",
    zonesSous: "Régions de Dakar et de Thiès. Choisissez une zone pour voir les structures de santé référencées.",
    voirStructures: "Voir les structures",
    droitsTitre: "Vos droits sur vos données",
    droits: [
      { icone: "document", titre: "Les consulter", texte: "Téléchargez à tout moment toutes les informations gardées sur vous, depuis « Mon suivi »." },
      { icone: "personne", titre: "Changer de référente", texte: "Sans avoir à vous justifier, en un clic." },
      { icone: "cadenas", titre: "Retirer un accord", texte: "Rappels, accompagnement ou aide de l'ordinateur : vous décidez, et vous pouvez changer d'avis." },
      { icone: "lien", titre: "Tout effacer", texte: "Supprimez votre compte et votre suivi. Vous pourrez vous réinscrire plus tard." },
    ] as Carte[],
    monSuivi: "Aller à mon suivi",
    faqTitre: "Questions fréquentes",
    faq: [
      { q: "Quelles informations dois-je donner ?", r: "Seulement votre prénom, un numéro de téléphone et votre zone. La date des dernières règles est facultative : elle sert à estimer la date prévue d'accouchement, que la sage-femme peut corriger." },
      { q: "Je ne lis pas bien. Puis-je utiliser Jongoma Care ?", r: "Oui. Les rendez-vous et les conseils peuvent être écoutés en audio, et une agente communautaire peut vous aider à vous inscrire." },
      { q: "Mon téléphone est partagé avec ma famille.", r: "Choisissez les messages discrets : les rappels ne mentionnent alors ni la grossesse ni le nom de la structure." },
      { q: "Qui peut voir mes informations ?", r: "Votre référente. Une spécialiste (sage-femme, assistante sociale, soutien psychosocial, protection) seulement si vous avez accepté l'orientation. Une structure de santé seulement pour les demandes que vous lui adressez." },
      { q: "Que se passe-t-il si je refuse l'aide de l'ordinateur ?", r: "Rien ne change dans votre accompagnement. Votre référente vous suit selon le calendrier habituel des consultations." },
      { q: "Je suis professionnelle de santé. Comment rejoindre la plateforme ?", r: "Faites une demande d'accès. Une coordinatrice vérifie votre fonction avant d'activer votre compte." },
    ],
    scoreTitre: "Fiche du score de priorisation (version règles)",
    score: "Le score ordonne les recontacts des référentes. Il ne sert jamais à refuser ou réduire un service. Il n'utilise ni l'âge, ni les données de santé mentale ou de protection. Une bénéficiaire peut s'y opposer sans perdre le service.",
    regle: "Règle",
    points: "Points",
    seuils: "Priorité haute à partir de 50 points, moyenne de 25 à 49. Poids provisoires, à valider par le référent clinique. Un modèle d'apprentissage automatique explicable remplacera ces règles après le pilote, avec contrôle des biais par zone et par langue.",
    iaTitre: "Intelligence artificielle : ce qui est réel, ce qui vient",
    iaSous: "Nous ne présentons comme fait que ce qui fonctionne. L'humain décide toujours.",
    ia: [
      { etape: "Aujourd'hui", statut: "En service", titre: "Des règles explicables", texte: "Le score qui ordonne les appels est une liste de règles publiques (ci-dessus). Chaque priorité affiche ses motifs. Il n'utilise ni l'âge, ni la santé mentale, ni la protection, et chaque femme peut le refuser." },
      { etape: "Pilote", statut: "Prototype", titre: "La voix en wolof", texte: "Synthèse et reconnaissance vocales wolof avec deux modèles open source (Adia_TTS et Whosper, licence Apache-2.0), auto-hébergés. L'assistant ne répond qu'avec des conseils validés par des sages-femmes et passe la main à la référente pour tout le reste. Qualité à évaluer avec des locutrices natives." },
      { etape: "Après le pilote", statut: "Prévu", titre: "Un modèle appris sur le pilote", texte: "Un modèle d'apprentissage automatique explicable, entraîné uniquement sur les données des femmes qui l'ont accepté. Il ne remplacera les règles que s'il fait mieux, sans écart entre zones ni entre langues, et sa fiche sera publiée." },
    ],
    routeTitre: "Feuille de route",
    route: [
      { phase: "Aujourd'hui", points: ["Accompagnement par une référente", "Rappels, audio et répertoire vérifié", "Espaces coordination, établissement et spécialistes", "Données ouvertes anonymisées"] },
      { phase: "Pilote", points: ["Envoi automatique des rappels par SMS", "Capsules audio enregistrées en wolof par des locutrices natives", "Protocole validé par des sages-femmes", "Hébergement sécurisé et sauvegardes chiffrées"] },
      { phase: "Ensuite", points: ["Serveur vocal (IVR) pour les téléphones sans Internet", "Échanges avec DHIS2 et HL7 FHIR", "Cartographie des besoins par quartier", "Extension à d'autres régions"] },
    ],
    rejoindreTitre: "Rejoindre Jongoma Care",
    rejoindre: "Femme enceinte ou jeune mère : inscrivez-vous en quelques minutes. Professionnelle ou structure de santé : demandez un accès.",
    sinscrire: "S'inscrire",
    acces: "Demander un accès professionnel",
  },
  en: {
    titre: "About Jongoma Care",
    sous: "Open-source platform developed by Jongoma Tech (Senegal).",
    faitTitre: "What the platform does",
    fait: "Every registered, consenting woman has a primary follow-up agent who supports her from registration to postnatal care. Reminders, audio, the verified directory and prevention tracking help her access care. The platform makes no diagnosis.",
    chiffres: [
      { valeur: String(ZONES.length), libelle: "areas covered" },
      { valeur: "4", libelle: "separate, revocable consents" },
      { valeur: "5", libelle: "stages, from sign-up to postnatal" },
      { valeur: "2", libelle: "languages: Wolof and French" },
    ],
    engagementsTitre: "Our commitments",
    engagementsSous: "Rules written into the code, not just into a charter.",
    engagements: [
      { icone: "cadenas", titre: "Consent comes first", texte: "The service, reminders, follow-up and computer assistance are each agreed to separately. Any consent can be withdrawn at any time without losing the rest of the service." },
      { icone: "bouclier", titre: "Everyone sees only what concerns them", texte: "An agent sees her own beneficiaries, a specialist only accepted referrals, a facility only the requests addressed to it." },
      { icone: "personne", titre: "Identity kept apart from follow-up", texte: "Name and phone number are stored separately. Follow-up records and the audit log hold only identifiers, never test results." },
      { icone: "etincelle", titre: "Explainable AI you can refuse", texte: "The prioritisation score is a list of public rules. It orders calls and never refuses a service. Any woman can opt out." },
      { icone: "hopital", titre: "Only the facility confirms", texte: "No appointment is ever confirmed automatically: the health facility validates it." },
      { icone: "graphique", titre: "Open data, kept anonymous", texte: `Public indicators are aggregated by area. Any value computed on fewer than ${SEUIL_MIN} people is hidden.` },
    ] as Carte[],
    zonesTitre: "Where we work",
    zonesSous: "Dakar and Thiès regions. Choose an area to see the listed health facilities.",
    voirStructures: "See facilities",
    droitsTitre: "Your rights over your data",
    droits: [
      { icone: "document", titre: "Access it", texte: "Download everything we hold about you at any time, from “My follow-up”." },
      { icone: "personne", titre: "Change your agent", texte: "No justification needed, in one click." },
      { icone: "cadenas", titre: "Withdraw consent", texte: "Reminders, follow-up or computer assistance: you decide, and you can change your mind." },
      { icone: "lien", titre: "Erase everything", texte: "Delete your account and your follow-up. You can sign up again later." },
    ] as Carte[],
    monSuivi: "Go to my follow-up",
    faqTitre: "Frequently asked questions",
    faq: [
      { q: "What information do I need to give?", r: "Only your first name, a phone number and your area. The date of your last period is optional: it is used to estimate the due date, which the midwife can correct." },
      { q: "I don't read well. Can I use Jongoma Care?", r: "Yes. Appointments and advice can be listened to as audio, and a community health worker can help you sign up." },
      { q: "My phone is shared with my family.", r: "Choose discreet messages: reminders then mention neither the pregnancy nor the name of the facility." },
      { q: "Who can see my information?", r: "Your agent. A specialist (midwife, social worker, psychosocial support, protection) only if you have accepted the referral. A health facility only for the requests you send it." },
      { q: "What happens if I refuse computer assistance?", r: "Nothing changes in your support. Your agent follows you according to the usual visit schedule." },
      { q: "I am a health professional. How do I join?", r: "Request access. A coordinator checks your role before activating your account." },
    ],
    scoreTitre: "Prioritisation score card (rule-based version)",
    score: "The score orders the agents' call-backs. It is never used to refuse or reduce a service. It uses neither age nor mental-health or protection data. A beneficiary can opt out without losing the service.",
    regle: "Rule",
    points: "Points",
    seuils: "High priority from 50 points, medium from 25 to 49. Provisional weights, to be validated by the clinical lead. An explainable machine-learning model will replace these rules after the pilot, with bias checks by area and language.",
    iaTitre: "Artificial intelligence: what is real, what comes next",
    iaSous: "We only present as done what actually works. A person always decides.",
    ia: [
      { etape: "Today", statut: "Live", titre: "Explainable rules", texte: "The score that orders calls is a list of public rules (above). Every priority shows its reasons. It uses no age, mental-health or protection data, and any woman can refuse it." },
      { etape: "Pilot", statut: "Prototype", titre: "Wolof voice", texte: "Wolof speech synthesis and recognition with two self-hosted open-source models (Adia_TTS and Whosper, Apache-2.0 licence). The assistant answers only with advice validated by midwives and hands everything else to the follow-up agent. Quality to be assessed with native speakers." },
      { etape: "After the pilot", statut: "Planned", titre: "A model learned from the pilot", texte: "An explainable machine-learning model, trained only on data from women who agreed to it. It will replace the rules only if it does better, with no gap between areas or languages, and its model card will be published." },
    ],
    routeTitre: "Roadmap",
    route: [
      { phase: "Today", points: ["Support from a dedicated agent", "Reminders, audio and a verified directory", "Coordination, facility and specialist workspaces", "Anonymised open data"] },
      { phase: "Pilot", points: ["Automatic SMS reminders", "Audio content recorded in Wolof by native speakers", "Protocol validated by midwives", "Secure hosting and encrypted backups"] },
      { phase: "Next", points: ["Voice server (IVR) for phones without Internet", "Data exchange with DHIS2 and HL7 FHIR", "Needs mapping by neighbourhood", "Expansion to other regions"] },
    ],
    rejoindreTitre: "Join Jongoma Care",
    rejoindre: "Pregnant or a new mother? Sign up in a few minutes. Health professional or facility? Request access.",
    sinscrire: "Sign up",
    acces: "Request professional access",
  },
};

function Section({ titre, sous, children }: { titre: string; sous?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-semibold">{titre}</h2>
        {sous && <p className="mt-1 text-sm text-muted">{sous}</p>}
      </div>
      {children}
    </section>
  );
}

function Cartes({ cartes, colonnes }: { cartes: Carte[]; colonnes: string }) {
  return (
    <div className={`grid gap-3 ${colonnes}`}>
      {cartes.map((c) => (
        <article key={c.titre} className="card space-y-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icone nom={c.icone} className="size-5" />
          </span>
          <h3 className="font-semibold">{c.titre}</h3>
          <p className="text-sm text-muted">{c.texte}</p>
        </article>
      ))}
    </div>
  );
}

export default async function APropos() {
  const langue = await getLangue();
  const t = T[langue];
  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <Titre titre={t.titre} sous={t.sous} />
        <Photo photo={PHOTOS.communaute} className="aspect-[21/9] rounded-3xl" sizes="(min-width: 1024px) 1000px, 100vw" />
        <section className="card space-y-2 text-sm">
          <h2 className="font-semibold">{t.faitTitre}</h2>
          <p>{t.fait}</p>
        </section>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {t.chiffres.map((c) => (
            <div key={c.libelle} className="card flex flex-col-reverse">
              <dt className="text-xs text-muted">{c.libelle}</dt>
              <dd className="font-display text-3xl font-semibold text-brand">{c.valeur}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Section titre={t.engagementsTitre} sous={t.engagementsSous}>
        <Cartes cartes={t.engagements} colonnes="sm:grid-cols-2 lg:grid-cols-3" />
      </Section>

      <Section titre={t.zonesTitre} sous={t.zonesSous}>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <Link key={z} href={`/structures?zone=${encodeURIComponent(z)}`} className="btn-sec" aria-label={`${t.voirStructures} : ${z}`}>
              <Icone nom="lieu" className="size-4 text-brand" /> {z}
            </Link>
          ))}
        </div>
      </Section>

      <Section titre={t.droitsTitre}>
        <Cartes cartes={t.droits} colonnes="sm:grid-cols-2 lg:grid-cols-4" />
        <Link href="/femme" className="btn-sec btn-sm">{t.monSuivi}</Link>
      </Section>

      <Section titre={t.faqTitre}>
        <div className="space-y-2">
          {t.faq.map((f) => (
            <details key={f.q} className="card group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                {f.q}
                <span aria-hidden className="text-lg text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.r}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="card text-sm">
        <h2 className="mb-2 font-semibold">{t.scoreTitre}</h2>
        <p className="mb-3 text-muted">{t.score}</p>
        <table className="w-full">
          <thead className="text-left text-xs text-muted"><tr><th className="py-1">{t.regle}</th><th className="text-right">{t.points}</th></tr></thead>
          <tbody className="divide-y divide-border">
            {REGLES.map((r) => <tr key={r.id}><td className="py-1.5">{langue === "en" ? REGLES_EN[r.id] : r.libelle}</td><td className="text-right tabular-nums">{r.poids}</td></tr>)}
          </tbody>
        </table>
        <p className="mt-3 text-muted">{t.seuils}</p>
      </section>

      <Section titre={t.iaTitre} sous={t.iaSous}>
        <ol className="grid gap-3 md:grid-cols-3">
          {t.ia.map((x, i) => (
            <li key={x.etape} className={`card space-y-2 ${i === 0 ? "border-brand" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{x.etape}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${i === 0 ? "bg-emerald-100 text-emerald-800" : i === 1 ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"}`}>{x.statut}</span>
              </div>
              <h3 className="font-semibold">{x.titre}</h3>
              <p className="text-sm text-muted">{x.texte}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section titre={t.routeTitre}>
        <ol className="grid gap-3 md:grid-cols-3">
          {t.route.map((etape, i) => (
            <li key={etape.phase} className={`card space-y-2 ${i === 0 ? "border-brand" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}>{i + 1}</span>
                <h3 className="font-semibold">{etape.phase}</h3>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {etape.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <section className="rounded-3xl bg-brand px-6 py-8 text-white sm:px-10">
        <h2 className="font-display text-2xl font-semibold">{t.rejoindreTitre}</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85">{t.rejoindre}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/inscription" className="btn bg-white text-brand">{t.sinscrire}</Link>
          <Link href="/inscription/personnel" className="btn border border-white/50 bg-transparent">{t.acces}</Link>
        </div>
      </section>
    </div>
  );
}
