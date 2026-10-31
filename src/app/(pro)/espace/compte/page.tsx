import { nomLangue } from "@/lib/langues";
import { ChampIcone } from "@/components/AuthShell";
import { Avatar, EnTete, Panneau, ilYa } from "@/components/pro";
import { Alerte, LIBELLES, libelleAction } from "@/components/ui";
import { changerMotDePasse } from "@/lib/actions";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

const ERREURS: Record<string, string> = {
  actuel: "Mot de passe actuel incorrect.",
  regles: "Le nouveau mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.",
  confirmation: "Les deux nouveaux mots de passe ne correspondent pas.",
  identique: "Le nouveau mot de passe doit être différent de l'actuel.",
};

const DROITS: Record<string, string[]> = {
  referente: ["Voir et suivre les bénéficiaires qui vous sont affectées", "Vérifier les rendez-vous et envoyer les rappels", "Proposer des orientations avec consentement", "Pas d'accès aux notes cliniques ni psychologiques"],
  coordinatrice: ["Affecter et réaffecter les bénéficiaires", "Valider les demandes d'accès", "Gérer le répertoire et les partenariats", "Consulter le journal d'audit et les indicateurs"],
  specialiste: ["Voir uniquement les orientations reçues avec consentement", "Mettre à jour leur statut", "Pas d'accès au dossier complet de la bénéficiaire"],
  etablissement: ["Répondre aux demandes adressées à votre structure", "Confirmer et déplacer les rendez-vous", "Mettre à jour la fiche de la structure"],
};

export default async function MonCompte({ searchParams }: PageProps<"/espace/compte">) {
  const s = await exigerRole("referente", "coordinatrice", "specialiste", "etablissement");
  const { ok, erreur } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const compte = base.comptes.find((c) => c.id === s.compteId)!;
  const p = base.personnel.find((x) => x.id === s.id);
  const role = p?.specialite ? LIBELLES.specialite[p.specialite] : ({ referente: "Référente principale", coordinatrice: "Coordinatrice", etablissement: "Établissement partenaire", specialiste: "Spécialiste" } as Record<string, string>)[s.role];
  const mesActions = base.journal.filter((j) => j.acteur === `${s.role}:${s.id}`).slice(0, 12);

  return (
    <div className="space-y-6">
      <EnTete titre="Mon compte" sous="Vos informations, vos accès et la sécurité de votre compte." />
      {ok && <Alerte>Mot de passe modifié. Utilisez-le à votre prochaine connexion.</Alerte>}
      {erreur && <Alerte ton="orange">{ERREURS[erreur] ?? "Modification impossible."}</Alerte>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panneau titre="Profil">
          <div className="flex items-center gap-4">
            <Avatar nom={compte.nom} />
            <div>
              <p className="text-lg font-semibold">{compte.nom}</p>
              <p className="text-sm text-muted">{role}</p>
            </div>
          </div>
          <dl className="mt-5 divide-y divide-border text-sm">
            <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Identifiant</dt><dd className="font-medium">{compte.identifiant}</dd></div>
            {p && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Zones</dt><dd>{p.zones.join(", ")}</dd></div>}
            {p && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Langues</dt><dd>{p.langues.map((l) => nomLangue(l).toLowerCase()).join(", ")}</dd></div>}
            <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Compte créé</dt><dd>{ilYa(compte.creeLe)}</dd></div>
            <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Dernière connexion</dt><dd>{compte.derniereConnexion ? new Date(compte.derniereConnexion).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"}</dd></div>
          </dl>
          <h3 className="mt-6 text-sm font-semibold">Vos accès</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {(DROITS[s.role] ?? []).map((d) => <li key={d} className="flex gap-2"><span className="text-brand">✓</span>{d}</li>)}
          </ul>
        </Panneau>

        <div className="space-y-6">
          <Panneau titre="Changer de mot de passe" sous="8 caractères minimum, dont une lettre et un chiffre.">
            <form action={changerMotDePasse} className="space-y-4">
              <div>
                <label className="label" htmlFor="actuel">Mot de passe actuel</label>
                <ChampIcone icone="cadenas"><input id="actuel" name="actuel" type="password" required autoComplete="current-password" className="field pl-10" /></ChampIcone>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="nouveau">Nouveau mot de passe</label>
                  <input id="nouveau" name="nouveau" type="password" required minLength={8} autoComplete="new-password" className="field" />
                </div>
                <div>
                  <label className="label" htmlFor="confirmation">Confirmer</label>
                  <input id="confirmation" name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="field" />
                </div>
              </div>
              <button className="btn">Enregistrer le nouveau mot de passe</button>
            </form>
          </Panneau>

          <Panneau titre="Mes dernières actions" sous="Extrait du journal d'audit">
            {mesActions.length === 0 ? (
              <p className="text-sm text-muted">Aucune action enregistrée.</p>
            ) : (
              <ul className="-my-2 divide-y divide-border text-sm">
                {mesActions.map((j) => (
                  <li key={j.id} className="flex justify-between gap-4 py-2">
                    <span>{libelleAction(j.action)}</span>
                    <span className="shrink-0 text-xs text-muted">{new Date(j.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
        </div>
      </div>
    </div>
  );
}
