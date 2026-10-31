import { langue as infoLangue, LANGUES, LIBELLE_VOIX } from "@/lib/langues";
import type { Metadata } from "next";
import Link from "next/link";
import { CourbeCroissance } from "@/components/Croissance";
import { Ecouter } from "@/components/Ecouter";
import { Parcours1000 } from "@/components/Parcours1000";
import { QuestionnaireDanger } from "@/components/QuestionnaireDanger";
import { Icone, type NomIcone } from "@/components/Icone";
import { Parler } from "@/components/Parler";
import { dateLongue, Kpi, Panneau, Vide } from "@/components/pro";
import { Alerte, Badge, fmt, LIBELLES, tonRdv } from "@/components/ui";
import { ajouterGardien, annulerDemande, changerReferente, cocherPremiereHeure, declarerEtatCivil, demanderConfidentiel, demanderAideBebe, retirerGardien, signalerDangerMere, majPreferences, repondreAllaitement, repondreOrientation, signalerSigneDanger, supprimerMesDonnees } from "@/lib/actions";
import { CAPSULES } from "@/lib/contenus";
import { db } from "@/lib/db";
import { ageBebe, ALLAITEMENT_JOURS_MAX, CERCLE_MAX, conseilDuMoment, ESPACEMENT, MENTION_SSR, REGLES_PUBERTE, VIOLENCES, FIRST_CRY_JOURS, LIENS_GARDIEN, PREMIERES_HEURES, SIGNES_DANGER_MERE, ETAT_CIVIL, etapeParcours, etatVaccins, LIBELLE_VACCIN, MENTION_A_VALIDER, MENTION_CONSEILS, nomBebe, NUMERO_URGENCE, prochaineEtape, SIGNES_DANGER } from "@/lib/enfants";
import { etatPreventions, PROGRAMMES } from "@/lib/programmes";
import { datePrevue, diffDays, ETAPES, semainesAmenorrhee, today } from "@/lib/protocol";
import { exigerRole, getSession } from "@/lib/session";

// Mode discret (téléphone partagé) : onglet et application installée s'appellent « Agenda »,
// avec une icône neutre, sans nom ni couleur de la marque.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSession();
  const b = s?.role === "beneficiaire" ? db().beneficiaires.find((x) => x.id === s.id) : undefined;
  if (!b?.messageDiscret) return {};
  return {
    title: "Agenda",
    manifest: "/manifest-discret.webmanifest",
    icons: { icon: "/brand/icone-neutre-192.png", apple: "/brand/icone-neutre-192.png" },
  };
}

const CANAL = { sms: "SMS", appel: "appel", audio: "message audio" } as const;

// Textes neutres : lisibles même sur un téléphone partagé.
const JEUNES_FILLES = [
  ["C'est confidentiel", "Votre référente ne parle de vous à personne sans votre accord."],
  ["Continuer l'école", "Votre référente vous aide à placer vos rendez-vous hors des cours, et à garder ou retrouver votre place à l'école."],
  ["Vous avez des droits", "Être soignée avec respect, poser toutes vos questions, venir avec une personne de confiance."],
] as const;

// Quand le rendez-vous a-t-il lieu, en mots simples.
const dans = (iso: string) => {
  const j = diffDays(iso, today());
  return j <= 0 ? "Aujourd'hui" : j === 1 ? "Demain" : `Dans ${j} jours`;
};

export default async function EspaceFemme({ searchParams }: PageProps<"/femme">) {
  const s = await exigerRole("beneficiaire");
  const sp = await searchParams;
  const base = db();
  const b = base.beneficiaires.find((x) => x.id === s.id);
  if (!b) return <p>Compte introuvable. <Link href="/connexion" className="underline">Se reconnecter</Link></p>;

  const t = today();
  const prenom = base.identites.find((i) => i.id === b.identiteId)?.prenom;
  const ref = base.personnel.find((p) => p.id === b.referenteId);
  const dpa = datePrevue(b.ddr, b.dpaCorrigee);
  const sa = b.ddr && b.etape !== "postnatal" && b.etape !== "cloture" ? semainesAmenorrhee(b.ddr) : null;
  const preventions = etatPreventions(b, base);
  const rdvs = base.rendezVous.filter((r) => r.beneficiaireId === b.id).sort((a, c) => a.date.localeCompare(c.date));
  const prochain = rdvs.find((r) => r.statut === "prevu" && r.date >= t);
  const aVenir = rdvs.filter((r) => r.statut === "prevu" && r.date >= t);
  const passes = rdvs.filter((r) => !(r.statut === "prevu" && r.date >= t)).reverse();
  const demandes = base.demandes.filter((d) => d.beneficiaireId === b.id).sort((a, c) => c.creeLe.localeCompare(a.creeLe));
  const demandesOuvertes = demandes.filter((d) => ["envoyee", "recue", "en_attente"].includes(d.statut));
  const orientations = base.orientations.filter((o) => o.beneficiaireId === b.id);
  const proposees = orientations.filter((o) => o.statut === "proposee");
  const nomStructure = (id: string) => base.structures.find((x) => x.id === id)?.nom ?? "";
  const bebe = base.bebes.find((x) => x.beneficiaireId === b.id);
  const vaccins = bebe ? etatVaccins(bebe, base) : [];
  const etapeVaccin = bebe ? prochaineEtape(bebe, base) : null;
  const vaccinsFaits = vaccins.filter((e) => e.statut === "fait").length;
  const conseil = bebe ? conseilDuMoment(bebe.dateNaissance, t) : undefined;
  const ageJours = bebe ? diffDays(t, bebe.dateNaissance) : null;
  const firstCry = ageJours !== null && ageJours <= 14;
  const gestesFaits = new Set(bebe?.premieresHeures ?? []);
  const maLangue = infoLangue(b.langue);
  const consultationsBebe = bebe ? rdvs.filter((r) => r.type === "CPoN" && r.date >= bebe.dateNaissance).reverse() : [];
  const vaccinsEchus = vaccins.filter((e) => e.statut !== "plus_tard").length;
  const preventionsAFaire = preventions.filter((e) => e.statut === "a_faire" || e.statut === "en_retard").length;
  const preventionsFaites = preventions.filter((e) => e.statut === "fait").length;
  const preventionsEchues = preventions.filter((e) => e.statut !== "plus_tard").length;
  const etapeIdx = ETAPES.findIndex((e) => e.id === b.etape);

  const resumeBebe = bebe
    ? etapeVaccin
      ? `${nomBebe(bebe)} a ${ageBebe(bebe.dateNaissance)}. Prochaine vaccination ${etapeVaccin.enRetard ? `en retard (prévue le ${fmt(etapeVaccin.du)})` : etapeVaccin.du <= t ? `à faire dès maintenant (prévue le ${fmt(etapeVaccin.du)})` : `vers le ${fmt(etapeVaccin.du)}`} : ${etapeVaccin.vaccins.map((e) => e.vaccin.nom).join(", ")}. Apportez le carnet de santé.`
      : `${nomBebe(bebe)} a ${ageBebe(bebe.dateNaissance)}. Les vaccins du calendrier sont à jour.`
    : "";
  const discret = b.messageDiscret;
  const libelle = (x: string) => (discret ? "Rendez-vous" : x);
  const lieu = (id: string) => (discret ? "" : nomStructure(id));
  const resume = prochain
    ? discret
      ? `Votre prochain rendez-vous : le ${fmt(prochain.date)}.`
      : `Votre prochain rendez-vous : ${prochain.libelle}, le ${fmt(prochain.date)}, à ${nomStructure(prochain.structureId)}.`
    : "Vous n'avez pas de rendez-vous prévu. Votre référente va vous contacter.";

  const toutEcouter = [resume, resumeBebe].filter(Boolean).join(" ");

  // Ce qui demande une action de sa part, ou mérite son attention.
  const aFaire: { icone: NomIcone; texte: string; detail: string; href: string; urgent?: boolean }[] = [];
  if (bebe?.alerteDangerLe) aFaire.push({ icone: "telephone", texte: "Votre référente est prévenue", detail: "Si vous n'êtes pas déjà au centre de santé, allez-y maintenant", href: "#bebe", urgent: true });
  if (bebe && !bebe.etatCivilLe) aFaire.push({ icone: "document", texte: discret ? "Une démarche à faire à la mairie" : "Déclarer la naissance à l'état civil", detail: "L'acte de naissance protège votre enfant", href: "#bebe" });
  if (etapeVaccin?.enRetard) aFaire.push({ icone: "calendrier", texte: "Vaccination de votre bébé en retard", detail: etapeVaccin.vaccins.map((e) => e.vaccin.nom).join(", "), href: "#bebe", urgent: true });
  if (prochain && !prochain.confirmeParStructure) aFaire.push({ icone: "hopital", texte: "Rendez-vous en attente de confirmation", detail: `${libelle(prochain.libelle)} · ${fmt(prochain.date)}`, href: "#calendrier" });
  if (preventionsAFaire) aFaire.push({ icone: "bouclier", texte: `${preventionsAFaire} soin${preventionsAFaire > 1 ? "s" : ""} de prévention à faire`, detail: discret ? "À voir lors de votre prochain rendez-vous" : "Parlez-en à la sage-femme à votre prochaine consultation", href: "#sante" });
  if (demandesOuvertes.length) aFaire.push({ icone: "message", texte: `${demandesOuvertes.length} demande${demandesOuvertes.length > 1 ? "s" : ""} de mise en relation en cours`, detail: "La structure vous répondra", href: "#calendrier" });

  const resumeAFaire = aFaire.length + proposees.length
    ? `Vous avez ${aFaire.length + proposees.length} chose${aFaire.length + proposees.length > 1 ? "s" : ""} à regarder. ${[...(proposees.length ? ["Votre référente vous propose une aide."] : []), ...aFaire.map((x) => `${x.texte}.`)].join(" ")}`
    : "Rien à faire pour le moment. Votre référente vous préviendra s'il y a du nouveau.";

  return (
    <div id="accueil" className="scroll-mt-40 lg:scroll-mt-8 space-y-6">
      {sp.bienvenue && <Alerte>Votre suivi est créé.{ref ? ` Votre référente s'appelle ${ref.prenom}.` : ""}</Alerte>}
      {sp.demande === "envoyee" && <Alerte>Demande envoyée. Le rendez-vous sera confirmé uniquement par la structure.</Alerte>}
      {sp.demande === "doublon" && <Alerte ton="orange">Vous avez déjà une demande en cours pour ce besoin auprès de cette structure.</Alerte>}
      {sp.demande === "annulee" && <Alerte>Demande annulée.</Alerte>}
      {sp.enregistre && <Alerte>Préférences enregistrées.</Alerte>}
      {sp.cercle === "ajoute" && <Alerte>La personne est ajoutée à votre cercle de soutien.</Alerte>}
      {sp.cercle === "invalide" && <Alerte ton="orange">Indiquez un prénom, un numéro valide, le lien, et confirmez que la personne est d&apos;accord (3 personnes au plus).</Alerte>}
      {sp.confidentiel && <Alerte>C&apos;est noté : votre référente vous rappellera discrètement. Le sujet de votre demande n&apos;est pas enregistré.</Alerte>}
      {sp.aide && <Alerte>Votre demande est envoyée : votre référente va vous rappeler.</Alerte>}
      {sp.alerte && <Alerte ton="orange">Votre référente est prévenue et va vous appeler. <strong>N&apos;attendez pas son appel : allez tout de suite au centre de santé</strong>, ou appelez le SAMU au {NUMERO_URGENCE}.</Alerte>}
      {sp.referente === "changee" && <Alerte>Une nouvelle référente vous a été attribuée.</Alerte>}
      {sp.referente === "indisponible" && <Alerte ton="orange">Aucune autre référente n&apos;est disponible dans votre zone pour le moment. La coordinatrice est informée et vous recontactera.</Alerte>}
      {sp.orientation === "acceptee" && <Alerte>Merci. L&apos;orientation est transmise à la spécialiste, qui vous contactera.</Alerte>}
      {sp.orientation === "refusee" && <Alerte>Votre refus est enregistré. Votre suivi continue normalement.</Alerte>}
      {sp.suppression && <Alerte ton="orange">Pour supprimer vos données, tapez SUPPRIMER dans la case de confirmation.</Alerte>}

      {/* En-tête : salutation, étape du parcours, prochain rendez-vous à écouter */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-encre px-5 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-sm text-white/90 first-letter:uppercase">{dateLongue(t)}</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Bonjour {prenom ?? ""}</h1>
        <p className="mt-1 text-sm text-white/90">Zone : {b.zone}{ref ? ` · Votre référente : ${ref.prenom}` : ""}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="max-w-xl text-base sm:text-lg">{resume}</p>
          <span className="text-foreground"><Ecouter texte={resume} /></span>
        </div>
        {!discret && <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Mon parcours">
          {ETAPES.map((e, i) => (
            <li key={e.id} className="min-w-0">
              <div className={`h-1.5 rounded-full ${i <= etapeIdx ? "bg-white" : "bg-white/25"}`} />
              <p className={`mt-1.5 truncate text-xs ${i === etapeIdx ? "font-semibold text-white" : "font-medium text-white/85"}`} aria-current={i === etapeIdx ? "step" : undefined}>{e.libelle}</p>
            </li>
          ))}
        </ol>}
      </section>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icone="calendrier" valeur={<span className="text-2xl sm:text-3xl">{prochain ? dans(prochain.date) : "—"}</span>} libelle="Prochain rendez-vous" detail={prochain ? `${fmt(prochain.date)} · ${prochain.confirmeParStructure ? "confirmé" : "à confirmer"}` : "Votre référente va vous appeler"} href="#calendrier" />
        {discret && !bebe ? (
          <Kpi icone="message" valeur={demandesOuvertes.length} libelle="Demandes en cours" detail="Mises en relation" href="#calendrier" />
        ) : bebe ? (
          <Kpi icone="personne" valeur={<span className="text-2xl sm:text-3xl">{ageBebe(bebe.dateNaissance)}</span>} libelle={`${nomBebe(bebe)}`} detail={`Né(e) le ${fmt(bebe.dateNaissance)}`} href="#bebe" />
        ) : (
          <Kpi icone="coeur" valeur={sa !== null ? `${sa} SA` : "—"} libelle="Ma grossesse" detail={dpa ? `Date prévue : ${fmt(dpa.date)}` : "Date à estimer par la sage-femme"} href="#sante" jauge={sa !== null ? (sa / 40) * 100 : undefined} seuilAlerte={101} />
        )}
        {bebe ? (
          <Kpi icone="bouclier" valeur={`${vaccinsFaits}/${vaccinsEchus}`} libelle="Vaccins faits" detail={etapeVaccin ? `Prochain : ${etapeVaccin.age}` : "Calendrier à jour"} href="#bebe" ton={etapeVaccin?.enRetard ? "alerte" : "succes"} />
        ) : (
          <Kpi icone="bouclier" valeur={`${preventionsFaites}/${preventionsEchues}`} libelle="Prévention faite" detail={preventionsAFaire ? `${preventionsAFaire} à faire` : "Tout est à jour"} href="#sante" ton={preventionsAFaire ? "alerte" : "succes"} />
        )}
        <Kpi icone="equipe" valeur={<span className="text-2xl sm:text-3xl">{ref?.prenom ?? "—"}</span>} libelle="Ma référente" detail={ref ? `Par ${CANAL[b.canal]}, le ${b.horaireContact}` : b.consentements.accompagnement ? "Bientôt attribuée" : "Accompagnement refusé"} href="#compte" />
      </div>

      {/* À faire + référente */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panneau titre="À faire" sous="Ce qui demande votre attention." compteur={aFaire.length + proposees.length} action={<Ecouter texte={resumeAFaire} />}>
          {proposees.length > 0 && (
            <div className="mb-3 space-y-3">
              <p className="text-sm font-semibold">Votre référente vous propose une aide</p>
              {proposees.map((o) => (
                <form key={o.id} action={repondreOrientation} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/40 bg-brand-soft/30 p-3">
                  <input type="hidden" name="orientationId" value={o.id} />
                  <span className="text-sm">
                    <span className="font-medium">{LIBELLES.specialite[o.type]}</span>
                    <span className="block text-xs text-muted">Si vous acceptez, cette personne pourra vous contacter. Si vous refusez, rien ne change dans votre suivi.</span>
                  </span>
                  <span className="flex gap-2">
                    <button name="reponse" value="accepter" className="btn btn-sm">J&apos;accepte</button>
                    <button name="reponse" value="refuser" className="btn-sec btn-sm">Je refuse</button>
                  </span>
                </form>
              ))}
            </div>
          )}
          {aFaire.length === 0 && proposees.length === 0 ? (
            <Vide icone="bouclier" titre="Rien à faire pour le moment" texte="Votre référente vous préviendra s'il y a du nouveau." />
          ) : (
            <ul className="space-y-2">
              {aFaire.map((x) => (
                <li key={x.texte}>
                  <a href={x.href} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-background">
                    <span className={`rounded-xl p-2 ${x.urgent ? "bg-red-100 text-red-700" : "bg-brand-soft text-brand"}`}><Icone nom={x.icone} className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{x.texte}</span>
                      <span className="block truncate text-xs text-muted">{x.detail}</span>
                    </span>
                    <span className="text-muted">→</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panneau>

        <Panneau titre="Ma référente">
          {ref ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand">{ref.prenom.slice(0, 1)}</span>
                <div>
                  <p className="text-lg font-semibold">{ref.prenom}</p>
                  <p className="text-sm text-muted">Elle vous contacte par {CANAL[b.canal]}, le {b.horaireContact}.</p>
                </div>
              </div>
              <p className="text-xs text-muted">Pour toute question sur votre suivi ou celui de votre bébé, attendez son appel ou demandez à être rappelée depuis « Écouter ».</p>
              <form action={changerReferente}>
                <button className="text-sm text-muted underline">Demander une autre référente</button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted">{b.consentements.accompagnement ? "Une référente va vous être attribuée." : "Vous avez choisi de ne pas être accompagnée. Vous gardez accès à tout le reste."}</p>
          )}
        </Panneau>
      </div>

      {/* Les 1 000 premiers jours : un parcours continu mère-bébé (masqué en mode discret) */}
      {!discret && (
        <Panneau titre="Nos 1 000 premiers jours" sous="De la grossesse aux 2 ans de votre enfant, un accompagnement à chaque étape.">
          <Parcours1000 actuelle={etapeParcours(b, bebe, t)} />
          <p className="mt-3 text-xs text-muted">Calendrier et conseils à valider par des professionnels de santé, selon les directives nationales.</p>
        </Panneau>
      )}

      {/* Jeunes filles : accompagnement adapté (titre neutre en mode discret) */}
      {b.jeuneFille && (
        <Panneau titre={discret ? "Pour vous" : "Espace jeunes filles"} sous={discret ? undefined : "Un accompagnement pensé pour vous."} action={<Ecouter texte={JEUNES_FILLES.map(([t, d]) => `${t}. ${d}`).join(" ")} />}>
          <ul className="grid gap-4 sm:grid-cols-3">
            {JEUNES_FILLES.map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-brand-soft/40 p-4">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">Une question ? Demandez à être rappelée depuis « Écouter » : votre référente vous répond, en toute confidentialité.</p>
        </Panneau>
      )}

      {/* Agenda */}
      <div id="calendrier" className="grid scroll-mt-40 lg:scroll-mt-8 gap-5 lg:grid-cols-2">
        <Panneau titre="Mon calendrier" sous="Vos consultations, confirmées par la structure." compteur={aVenir.length}>
          {rdvs.length === 0 && <p className="text-sm text-muted">Votre référente et la sage-femme vont établir votre calendrier.</p>}
          {aVenir.length > 0 && (
            <ul className="space-y-2">
              {aVenir.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-brand-soft py-1 text-brand">
                    <span className="text-[10px] font-semibold uppercase">{new Date(r.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                    <span className="font-display text-xl font-semibold leading-none">{new Date(r.date).getUTCDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{libelle(r.libelle)}</span>
                    <span className="block text-xs text-muted">{[lieu(r.structureId), dans(r.date)].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Badge ton={r.confirmeParStructure ? "vert" : "orange"}>{r.confirmeParStructure ? "Confirmé" : "À confirmer"}</Badge>
                </li>
              ))}
            </ul>
          )}
          {passes.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted underline">Rendez-vous passés ({passes.length})</summary>
              <ul className="mt-2 divide-y divide-border">
                {passes.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><span className="font-medium">{fmt(r.date)}</span> — {libelle(r.libelle)}</span>
                    <Badge ton={tonRdv(r.statut)}>{LIBELLES.rdv[r.statut]}</Badge>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panneau>

        <Panneau titre="Mes demandes de mise en relation" compteur={demandesOuvertes.length} action={<Link href="/femme/structures" className="btn btn-sm">Nouvelle demande</Link>}>
          {demandes.length === 0 ? (
            <Vide icone="hopital" titre="Aucune demande" texte="Trouvez une structure de santé vérifiée et demandez un rendez-vous." />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {demandes.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{discret ? "Demande de rendez-vous" : `${d.besoin} — ${nomStructure(d.structureId)}`}{d.dateProposee && ` · ${fmt(d.dateProposee)}`}</span>
                  <span className="flex items-center gap-2">
                    <Badge ton={d.statut === "acceptee" ? "vert" : d.statut === "refusee" ? "rouge" : d.statut === "annulee" ? "gris" : "orange"}>{LIBELLES.demande[d.statut]}</Badge>
                    {["envoyee", "recue", "en_attente"].includes(d.statut) && (
                      <form action={annulerDemande}>
                        <input type="hidden" name="demandeId" value={d.id} />
                        <button className="text-xs text-muted underline">Annuler</button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>

      {/* Bébé */}
      {bebe && (
        <div id="bebe" className="scroll-mt-40 lg:scroll-mt-8">
          <Panneau titre="Mon bébé" sous={`${nomBebe(bebe)} · ${ageBebe(bebe.dateNaissance)}`}>
            <div className="space-y-3">
              {firstCry && (
                <div className="rounded-2xl border-2 border-brand/30 bg-brand-soft/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">First Cry · {ageJours! <= FIRST_CRY_JOURS ? "les 72 premières heures" : "récapitulatif des 72 premières heures"}</p>
                  <p className="mt-1 text-sm text-muted">Les gestes qui protègent bébé et maman juste après la naissance. Cochez ce qui est fait ; votre référente suit avec vous.</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PREMIERES_HEURES.map((g) => (
                      <li key={g.id}>
                        <form action={cocherPremiereHeure}>
                          <input type="hidden" name="geste" value={g.id} />
                          <button className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left text-sm ring-1 transition ${gestesFaits.has(g.id) ? "bg-card ring-brand/40" : "bg-card/60 ring-border hover:ring-brand/40"}`} aria-pressed={gestesFaits.has(g.id)}>
                            <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${gestesFaits.has(g.id) ? "bg-brand text-white" : "ring-1 ring-border"}`}>{gestesFaits.has(g.id) ? "✓" : ""}</span>
                            <span><span className="block text-xs font-semibold text-brand">{g.moment}</span>{g.texte}</span>
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-xl bg-red-50/80 p-3 text-sm text-red-950 ring-1 ring-red-200">
                    <p className="font-semibold">Et pour vous, maman : allez tout de suite au centre de santé en cas de</p>
                    <p className="mt-1">{SIGNES_DANGER_MERE.join(" · ")}.</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Ecouter texte={`Pour vous, maman, allez tout de suite au centre de santé en cas de : ${SIGNES_DANGER_MERE.join(", ")}.`} />
                      {b.alerteMereLe ? <span className="font-semibold">Votre référente est prévenue.</span> : <form action={signalerDangerMere}><button className="btn btn-sm !bg-red-700 hover:!bg-red-800">J&apos;ai un de ces signes : prévenir ma référente</button></form>}
                    </div>
                  </div>
                </div>
              )}
              <p className="text-lg">{resumeBebe}</p>
              {etapeVaccin?.enRetard && <Badge ton="rouge">Vaccination en retard : parlez-en à votre référente</Badge>}
              <Ecouter texte={resumeBebe} />
              <div className="h-2 rounded-full bg-stone-100" role="img" aria-label={`${vaccinsFaits} vaccins faits sur ${vaccinsEchus}`}>
                <div className="h-2 rounded-full bg-brand" style={{ width: `${vaccinsEchus ? (vaccinsFaits / vaccinsEchus) * 100 : 100}%` }} />
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted underline">Voir tout le calendrier de vaccination</summary>
                <ul className="mt-2 divide-y divide-border">
                  {vaccins.map((e) => (
                    <li key={e.vaccin.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                      <span>{e.vaccin.nom} <span className="text-xs text-muted">· {e.vaccin.age}, vers le {fmt(e.du)}</span></span>
                      <Badge ton={e.statut === "fait" ? "vert" : e.statut === "en_retard" ? "rouge" : e.statut === "a_faire" ? "orange" : "gris"}>{LIBELLE_VACCIN[e.statut]}</Badge>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">Croissance</p>
                  <p className="mb-2 text-xs text-muted">Poids recopié du carnet de santé à chaque consultation.</p>
                  <CourbeCroissance bebe={bebe} />
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">Consultations de bébé</p>
                  {consultationsBebe.length ? (
                    <ul className="mt-2 divide-y divide-border text-sm">
                      {consultationsBebe.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                          <span>{libelle(r.libelle)} <span className="text-xs text-muted">· {fmt(r.date)}</span></span>
                          <Badge ton={tonRdv(r.statut)}>{LIBELLES.rdv[r.statut]}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-2 text-sm text-muted">Aucune consultation enregistrée pour l&apos;instant.</p>}
                  {(bebe.visites ?? []).length > 0 && <p className="mt-3 text-sm">Visites à domicile de votre référente : {bebe.visites!.map((v) => fmt(v.date)).join(", ")}.</p>}
                  <Link href="/femme/structures" className="mt-3 inline-block text-sm text-brand underline">Trouver un centre de santé pour les vaccins</Link>
                </div>
              </div>

              {conseil && (
                <div className="rounded-2xl bg-brand-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">Conseil du moment · {conseil.periode}</p>
                  <p className="mt-1 text-sm">{conseil.texte}</p>
                  <div className="mt-2"><Ecouter texte={conseil.texte} /></div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">{discret ? "Démarche à la mairie" : "Déclaration à l'état civil"}</p>
                  {bebe.etatCivilLe ? (
                    <p className="mt-1 text-sm text-muted">Faite le {fmt(bebe.etatCivilLe)}. Gardez l&apos;acte de naissance en lieu sûr.</p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-muted">{ETAT_CIVIL}</p>
                      <form action={declarerEtatCivil} className="mt-3 flex flex-wrap items-end gap-2">
                        <label className="text-xs text-muted">Date<input type="date" name="date" max={t} min={bebe.dateNaissance} defaultValue={t} className="field mt-1 w-auto" /></label>
                        <button className="btn-sec btn-sm">C&apos;est fait</button>
                      </form>
                    </>
                  )}
                </div>
                {diffDays(t, bebe.dateNaissance) <= ALLAITEMENT_JOURS_MAX && (
                  <div className="rounded-2xl border border-border p-4">
                    <p className="font-semibold">Allaitement</p>
                    <p className="mt-1 text-sm text-muted">Jusqu&apos;à 6 mois, le lait maternel suffit à bébé. Ces derniers jours, bébé a-t-il bu seulement votre lait ?</p>
                    {bebe.allaitement && <p className="mt-1 text-xs text-muted">Votre réponse du {fmt(bebe.allaitement.date)} : {bebe.allaitement.exclusif ? "oui" : "non"}.</p>}
                    <form action={repondreAllaitement} className="mt-3 flex gap-2">
                      <button name="exclusif" value="oui" className="btn-sec btn-sm">Oui</button>
                      <button name="exclusif" value="non" className="btn-sec btn-sm">Non, il boit aussi autre chose</button>
                    </form>
                    {bebe.allaitement && !bebe.allaitement.exclusif && <p className="mt-2 text-xs text-muted">Votre référente peut vous aider, et vous orienter vers une sage-femme si besoin.</p>}
                    <form action={demanderAideBebe} className="mt-2"><input type="hidden" name="motif" value="allaitement" /><button className="text-xs text-brand underline">J&apos;ai des difficultés : être rappelée</button></form>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
                <p className="font-semibold text-red-900">Signes de danger : allez tout de suite au centre de santé</p>
                <ul className="mt-2 grid gap-1 text-sm text-red-950 sm:grid-cols-2">
                  {SIGNES_DANGER.map((x) => <li key={x} className="flex gap-2"><span aria-hidden>•</span>{x}</li>)}
                </ul>
                <div className="mt-2"><Ecouter texte={`Allez tout de suite au centre de santé si votre bébé : ${SIGNES_DANGER.join(". ")}.`} /></div>
                <div className="mt-3">
                  <QuestionnaireDanger signes={SIGNES_DANGER} urgence={NUMERO_URGENCE} alerteEnCours={!!bebe.alerteDangerLe} alerter={signalerSigneDanger} demanderAide={demanderAideBebe} />
                </div>
                <p className="mt-2 text-xs text-red-900/80">{MENTION_CONSEILS}</p>
              </div>

              <p className="text-xs text-muted">Seuls sont notés la date de naissance, le sexe si vous l&apos;avez donné, le poids et la taille du carnet, les vaccins, les visites, la date de déclaration à l&apos;état civil et vos réponses sur l&apos;allaitement. Si vous signalez un signe de danger, seul le fait est noté, jamais lequel. C&apos;est l&apos;agent de santé qui vaccine. {MENTION_A_VALIDER} Le suivi du bébé fait partie de votre accompagnement : vous pouvez le retirer en retirant votre accord.</p>
            </div>
          </Panneau>
        </div>
      )}

      {/* Santé : grossesse et prévention */}
      <div id="sante" className="grid scroll-mt-40 lg:scroll-mt-8 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panneau titre="Ma grossesse">
          {dpa ? (
            <div className="space-y-2">
              <p className="text-lg">Date prévue (estimation) : {fmt(dpa.date)}</p>
              {sa !== null && (
                <>
                  <p className="text-sm">{sa} semaines d&apos;aménorrhée</p>
                  <div className="h-2 rounded-full bg-stone-100" role="img" aria-label={`${sa} semaines sur 40`}>
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, (sa / 40) * 100)}%` }} />
                  </div>
                </>
              )}
              <p className="text-xs text-muted">Source : {dpa.source}. Ce n&apos;est pas une date certaine.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucune date renseignée. La sage-femme pourra l&apos;estimer.</p>
          )}
        </Panneau>

        <Panneau titre="Ma prévention" sous="Les soins qui vous protègent, vous et votre bébé." compteur={preventionsAFaire}>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROGRAMMES.map((pg) => {
              const lignes = preventions.filter((e) => e.action.programme === pg.id && e.statut !== "plus_tard");
              if (lignes.length === 0) return null;
              const reste = lignes.filter((e) => e.statut === "a_faire" || e.statut === "en_retard").length;
              const refus = lignes.filter((e) => e.statut === "refuse").length;
              return (
                <div key={pg.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{pg.court}</p>
                    <Badge ton={reste ? "orange" : refus ? "gris" : "vert"}>{reste ? `${reste} à faire` : refus ? "Refusé" : "À jour"}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {lignes.map((e) => (
                      <li key={e.action.id} className="flex gap-2">
                        <span className={e.statut === "fait" ? "text-emerald-600" : "text-muted"}>{e.statut === "fait" ? "✓" : e.statut === "refuse" ? "–" : "○"}</span>
                        <span>{e.action.libelle}{e.statut === "refuse" && <span className="text-xs text-muted"> (refusé, vous pouvez changer d&apos;avis)</span>}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2"><Ecouter texte={pg.pourquoi} libelle="Pourquoi ?" /></div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Jongoma Care n&apos;enregistre jamais les résultats de vos examens. Ils restent entre vous et votre sage-femme.</p>
        </Panneau>
      </div>

      {/* Santé et droits sexuels et reproductifs (titres neutres en mode discret) */}
      <Panneau titre={discret ? "Ma santé" : "Ma santé et mes droits"} sous="Des informations confidentielles, et une personne formée pour en parler si vous le souhaitez.">
        <div className={`grid gap-4 ${b.jeuneFille ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
          <div className="rounded-2xl border border-border p-4">
            <p className="font-semibold">{discret ? "Prendre soin de soi" : "Espacement des naissances"}</p>
            <p className="mt-1 text-sm text-muted">{ESPACEMENT.texte}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Ecouter texte={ESPACEMENT.texte} />
              {b.souhaitSageFemmeLe ? <span className="text-xs font-semibold text-brand">Demande envoyée</span> : (
                <form action={demanderConfidentiel}><input type="hidden" name="quoi" value="sage_femme" /><button className="btn-sec btn-sm">En parler à une sage-femme</button></form>
              )}
            </div>
          </div>
          {b.jeuneFille && (
            <div className="rounded-2xl border border-border p-4">
              <p className="font-semibold">{discret ? "Mon corps" : "Règles et puberté"}</p>
              <p className="mt-1 text-sm text-muted">{REGLES_PUBERTE.texte}</p>
              <div className="mt-3"><Ecouter texte={REGLES_PUBERTE.texte} /></div>
            </div>
          )}
          <div className="rounded-2xl border border-border p-4">
            <p className="font-semibold">{discret ? "Parler en confiance" : "Violences : vous n'êtes pas seule"}</p>
            <p className="mt-1 text-sm text-muted">{VIOLENCES.texte}</p>
            <p className="mt-2 text-sm font-semibold text-red-800">{VIOLENCES.urgence}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Ecouter texte={`${VIOLENCES.texte} ${VIOLENCES.urgence}`} />
              {b.aideConfidentielleLe ? <span className="text-xs font-semibold text-brand">Demande envoyée</span> : (
                <form action={demanderConfidentiel}><input type="hidden" name="quoi" value="discret" /><button className="btn-sec btn-sm">Être rappelée discrètement</button></form>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">{MENTION_SSR}</p>
      </Panneau>

      {/* Écouter */}
      <div id="ecouter" className="scroll-mt-40 lg:scroll-mt-8">
        <Panneau titre="Voice of Mama" sous="Tout écouter et poser une question à voix haute. Conseils en attente de validation par une sage-femme." action={<Ecouter texte={toutEcouter} libelle="Tout écouter" />}>
          <div className="mb-4 rounded-xl bg-brand-soft/40 p-3 text-sm">
            <p><span className="font-semibold">Votre langue : {maLangue?.nom ?? b.langue}</span> · {LIBELLE_VOIX[maLangue?.voix ?? "a_enregistrer"]}</p>
            <p className="mt-1 text-xs text-muted">{maLangue?.voix === "disponible" ? "Les conseils se lisent à voix haute dans votre langue." : maLangue?.voix === "test" ? "La voix wolof est en test avec des femmes ; en attendant, les conseils se lisent en français et votre référente vous les explique en wolof." : "Les messages dans votre langue seront enregistrés par des locutrices natives. En attendant, votre référente vous explique tout dans votre langue."}</p>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer text-brand underline">Langues prises en charge</summary>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {LANGUES.map((l) => <li key={l.code} className="rounded-full bg-card px-2 py-0.5 ring-1 ring-border">{l.nom} · {LIBELLE_VOIX[l.voix].toLowerCase()}</li>)}
              </ul>
            </details>
          </div>
          <div className="mb-4"><Parler /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CAPSULES.map((c) => (
              <div key={c.titre} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
                <span className="text-sm font-medium">{c.titre}</span>
                <Ecouter texte={c.texte} />
              </div>
            ))}
          </div>
        </Panneau>
      </div>

      {/* Compte : orientations, préférences, données */}
      <div id="compte" className="scroll-mt-40 lg:scroll-mt-8 space-y-5">
        <Panneau titre={discret ? "Mes proches" : "Baby Guardian · mon cercle de soutien"} sous="Jusqu'à 3 proches ou une bajenu gox, avec leur accord. Votre référente peut les appeler si vous ne répondez pas pendant une alerte.">
          {(b.cercle ?? []).length > 0 && (
            <ul className="mb-4 divide-y divide-border text-sm">
              {b.cercle!.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><span className="font-medium">{g.prenom}</span> · {LIENS_GARDIEN[g.lien]} · {g.telephone}{g.prevenirSiAlerte ? <span className="text-xs text-muted"> · peut être prévenue en cas d&apos;alerte</span> : ""}</span>
                  <form action={retirerGardien}><input type="hidden" name="gardienId" value={g.id} /><button className="text-xs text-muted underline">Retirer</button></form>
                </li>
              ))}
            </ul>
          )}
          {(b.cercle ?? []).length < CERCLE_MAX ? (
            <form action={ajouterGardien} className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Prénom<input name="prenom" required maxLength={40} className="field mt-1" /></label>
              <label className="text-sm">Lien<select name="lien" className="field mt-1">{Object.entries(LIENS_GARDIEN).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label className="text-sm">Téléphone<input name="telephone" required type="tel" inputMode="tel" placeholder="77 123 45 67" className="field mt-1" /></label>
              <label className="flex gap-2 text-sm sm:col-span-3"><input type="checkbox" name="prevenir" defaultChecked className="mt-0.5 size-4 accent-[var(--brand)]" />Ma référente peut la prévenir si je ne réponds pas pendant une alerte</label>
              <label className="flex gap-2 text-sm sm:col-span-3"><input type="checkbox" name="accord" required className="mt-0.5 size-4 accent-[var(--brand)]" />Cette personne est d&apos;accord pour faire partie de mon cercle</label>
              <div className="sm:col-span-3"><button className="btn-sec btn-sm">Ajouter à mon cercle</button></div>
            </form>
          ) : <p className="text-sm text-muted">Votre cercle est complet (3 personnes).</p>}
        </Panneau>
        {orientations.some((o) => o.statut !== "proposee") && (
          <Panneau titre="Mes orientations">
            <ul className="divide-y divide-border text-sm">
              {orientations.filter((o) => o.statut !== "proposee").map((o) => (
                <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{LIBELLES.specialite[o.type]} <span className="text-xs text-muted">· depuis le {fmt(o.creeLe)}</span></span>
                  <Badge ton={o.statut === "prise_en_charge" || o.statut === "cloturee" ? "vert" : o.statut === "refusee" ? "gris" : "orange"}>{LIBELLES.orientation[o.statut]}</Badge>
                </li>
              ))}
            </ul>
          </Panneau>
        )}

        <details className="card">
          <summary className="cursor-pointer font-semibold">Mes préférences et mes accords</summary>
          <form action={majPreferences} className="mt-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <select name="canal" defaultValue={b.canal} className="field">
                <option value="sms">SMS</option>
                <option value="appel">Appel</option>
                <option value="audio">Message audio</option>
              </select>
              <select name="horaire" defaultValue={b.horaireContact} className="field">
                <option>matin</option>
                <option>après-midi</option>
                <option>soir</option>
              </select>
            </div>
            <label className="flex gap-2"><input type="checkbox" name="discret" defaultChecked={b.messageDiscret} /> <span>Messages discrets<span className="block text-xs text-muted">Rappels sans mention de la grossesse ni de la structure. Si vous installez l&apos;application, elle s&apos;appellera « Agenda », avec une icône neutre.</span></span></label>
            <label className="flex gap-2"><input type="checkbox" name="c_rappels" defaultChecked={b.consentements.rappels} /> Recevoir des rappels</label>
            <label className="flex gap-2"><input type="checkbox" name="c_accompagnement" defaultChecked={b.consentements.accompagnement} /> Être accompagnée par une référente</label>
            <label className="flex gap-2"><input type="checkbox" name="c_ia" defaultChecked={b.consentements.ia} /> Aide de l&apos;ordinateur pour organiser les appels</label>
            <button className="btn btn-sm">Enregistrer</button>
          </form>
        </details>

        <details className="card">
          <summary className="cursor-pointer font-semibold">Mes données</summary>
          <div className="mt-4 space-y-4 text-sm">
            <p>Vous pouvez télécharger toutes les informations que Jongoma Care garde sur vous. Pour corriger une information, demandez à votre référente.</p>
            <a href="/api/mes-donnees" className="btn-sec btn-sm">Télécharger mes données</a>
            <form action={supprimerMesDonnees} className="space-y-2 rounded-xl border border-red-200 p-3">
              <p className="font-medium">Supprimer mon compte et mes données</p>
              <p className="text-xs text-muted">Votre suivi, vos rendez-vous et vos demandes seront effacés définitivement. Vous pourrez vous réinscrire plus tard.</p>
              <label className="label" htmlFor="confirmation">Tapez SUPPRIMER pour confirmer</label>
              <div className="flex flex-wrap gap-2">
                <input id="confirmation" name="confirmation" className="field w-auto" autoComplete="off" required />
                <button className="btn btn-sm bg-red-700">Supprimer définitivement</button>
              </div>
            </form>
          </div>
        </details>
      </div>

    </div>
  );
}
