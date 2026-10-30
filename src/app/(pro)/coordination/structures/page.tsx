import { EnTete, Kpi, Panneau, ilYa } from "@/components/pro";
import { Alerte, Badge, LIBELLES } from "@/components/ui";
import { ajouterStructure, majStatutStructure, reverifierStructure } from "@/lib/actions";
import { db } from "@/lib/db";
import { diffDays, today } from "@/lib/protocol";
import { exigerRole } from "@/lib/session";
import { ZONES } from "@/lib/types";

const VERIFICATION_JOURS = 90; // au-delà, l'information est considérée comme à revérifier

export default async function GestionStructures({ searchParams }: PageProps<"/coordination/structures">) {
  await exigerRole("coordinatrice");
  const { ajoutee, erreur } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const t = today();
  const structures = [...base.structures].sort((a, b) => b.signalements - a.signalements || a.zone.localeCompare(b.zone) || a.nom.localeCompare(b.nom));
  const aReverifier = (d: string) => diffDays(t, d) > VERIFICATION_JOURS;
  const demandesDe = (id: string) => base.demandes.filter((d) => d.structureId === id).length;

  return (
    <div className="space-y-6">
      <EnTete titre="Structures et partenariats" sous="Le répertoire ne doit jamais laisser croire qu'une structure est partenaire sans son accord formel." actions={<a href="#ajouter" className="btn btn-sm">Ajouter une structure</a>} />
      {ajoutee && <Alerte>Structure ajoutée au répertoire avec le statut « référencée ».</Alerte>}
      {erreur && <Alerte ton="orange">Nom, type et zone sont obligatoires.</Alerte>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icone="hopital" valeur={structures.length} libelle="Structures référencées" />
        <Kpi icone="bouclier" valeur={structures.filter((s) => s.statut === "partenaire").length} libelle="Partenaires confirmés" detail="Accord formel signé" ton="succes" />
        <Kpi icone="message" valeur={structures.filter((s) => s.signalements > 0).length} libelle="Signalées" detail="Information à corriger" ton={structures.some((s) => s.signalements > 0) ? "alerte" : "succes"} />
        <Kpi icone="calendrier" valeur={structures.filter((s) => aReverifier(s.derniereVerification)).length} libelle="À revérifier" detail={`Vérifiées il y a plus de ${VERIFICATION_JOURS} jours`} ton="neutre" />
      </div>

      <Panneau titre="Répertoire" compteur={structures.length}>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-2.5 font-semibold">Structure</th><th className="font-semibold">Zone</th><th className="font-semibold">Vérification</th><th className="text-right font-semibold">Demandes</th><th className="font-semibold">Statut de partenariat</th><th className="pr-5 font-semibold" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {structures.map((s) => (
                <tr key={s.id} className="align-middle">
                  <td className="px-5 py-3">
                    <p className="font-medium">{s.nom}</p>
                    <p className="text-xs text-muted">{s.type} · {s.telephone}</p>
                  </td>
                  <td>{s.zone}</td>
                  <td className="text-xs">
                    <span className={aReverifier(s.derniereVerification) ? "font-semibold text-accent" : "text-muted"}>{ilYa(s.derniereVerification)}</span>
                    {s.signalements > 0 && <span className="mt-1 block"><Badge ton="orange">{s.signalements} signalement{s.signalements > 1 ? "s" : ""}</Badge></span>}
                  </td>
                  <td className="text-right tabular-nums">{demandesDe(s.id)}</td>
                  <td>
                    {/* key : le formulaire est reconstruit avec la nouvelle valeur après enregistrement */}
                    <form key={s.statut} action={majStatutStructure} className="flex items-center gap-1.5">
                      <input type="hidden" name="structureId" value={s.id} />
                      <select name="statut" defaultValue={s.statut} className="field w-auto py-1 text-xs" aria-label={`Statut de ${s.nom}`}>
                        {Object.entries(LIBELLES.partenariat).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <button className="btn-sec btn-sm">OK</button>
                    </form>
                  </td>
                  <td className="pr-5">
                    <form action={reverifierStructure}>
                      <input type="hidden" name="structureId" value={s.id} />
                      <button className="btn-sec btn-sm whitespace-nowrap">Revérifiée aujourd&apos;hui</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>

      <Panneau id="ajouter" titre="Ajouter une structure" sous="Elle est ajoutée avec le statut « référencée ». Passez-la en « partenaire confirmé » seulement après un accord formel.">
        <form action={ajouterStructure} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label" htmlFor="nom">Nom officiel</label><input id="nom" name="nom" required className="field" /></div>
          <div>
            <label className="label" htmlFor="type">Type</label>
            <select id="type" name="type" className="field">{["Centre de santé", "Poste de santé", "Hôpital", "Maternité", "Association"].map((x) => <option key={x}>{x}</option>)}</select>
          </div>
          <div>
            <label className="label" htmlFor="zone">Zone</label>
            <select id="zone" name="zone" className="field">{ZONES.map((z) => <option key={z}>{z}</option>)}</select>
          </div>
          <div><label className="label" htmlFor="telephone">Téléphone</label><input id="telephone" name="telephone" className="field" /></div>
          <div><label className="label" htmlFor="horaires">Horaires</label><input id="horaires" name="horaires" className="field" placeholder="Lun–Ven 8h–17h" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="adresse">Adresse</label><input id="adresse" name="adresse" className="field" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="services">Services (séparés par des virgules)</label><input id="services" name="services" className="field" placeholder="Consultation prénatale, Consultation postnatale" /></div>
          <div className="sm:col-span-2"><button className="btn">Ajouter au répertoire</button></div>
        </form>
      </Panneau>
    </div>
  );
}
