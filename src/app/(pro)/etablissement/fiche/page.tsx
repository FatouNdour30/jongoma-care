import { EnTete, Panneau, ilYa } from "@/components/pro";
import { Alerte, Badge, LIBELLES } from "@/components/ui";
import { majFicheEtablissement } from "@/lib/actions";
import { db } from "@/lib/db";
import { exigerRole } from "@/lib/session";

const SERVICES = ["Consultation prénatale", "Consultation postnatale", "Accouchement", "Planification familiale", "Information santé reproductive", "Vaccination", "Soutien psychosocial", "Orientation protection"];

export default async function FicheEtablissement({ searchParams }: PageProps<"/etablissement/fiche">) {
  const s = await exigerRole("etablissement");
  const { enregistre } = (await searchParams) as Record<string, string | undefined>;
  const base = db();
  const compte = base.comptesEtablissement.find((c) => c.id === s.id);
  const st = base.structures.find((x) => x.id === compte?.structureId);
  if (!st) return null;
  const autres = st.services.filter((x) => !SERVICES.includes(x));

  return (
    <div className="space-y-6">
      <EnTete titre="Ma fiche" sous="Ces informations apparaissent dans le répertoire consulté par les bénéficiaires et les référentes." />
      {enregistre && <Alerte>Fiche mise à jour. La date de vérification a été actualisée.</Alerte>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panneau titre="Informations de service">
          <form action={majFicheEtablissement} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="telephone">Téléphone</label><input id="telephone" name="telephone" defaultValue={st.telephone} className="field" /></div>
              <div><label className="label" htmlFor="horaires">Horaires</label><input id="horaires" name="horaires" defaultValue={st.horaires} className="field" /></div>
            </div>
            <div><label className="label" htmlFor="adresse">Adresse</label><input id="adresse" name="adresse" defaultValue={st.adresse} className="field" /></div>
            <fieldset>
              <legend className="label">Services proposés</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICES.map((x) => (
                  <label key={x} className="flex cursor-pointer items-center gap-2 rounded-xl p-2.5 text-sm ring-1 ring-border has-[:checked]:bg-brand-soft/30 has-[:checked]:ring-brand/40">
                    <input type="checkbox" name="services" value={x} defaultChecked={st.services.includes(x)} className="size-4 accent-[var(--brand)]" />
                    {x}
                  </label>
                ))}
              </div>
            </fieldset>
            <div><label className="label" htmlFor="autres">Autres services (séparés par des virgules)</label><input id="autres" name="autres" defaultValue={autres.join(", ")} className="field" /></div>
            <button className="btn">Enregistrer la fiche</button>
          </form>
        </Panneau>

        <Panneau titre="Aperçu dans le répertoire">
          <div className="space-y-2 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold">{st.nom}</p>
              <Badge ton={st.statut === "partenaire" ? "vert" : "gris"}>{LIBELLES.partenariat[st.statut]}</Badge>
            </div>
            <p className="text-sm text-muted">{st.type} · {st.adresse}</p>
            <p className="text-sm">{st.services.join(" · ")}</p>
            <p className="text-sm">{st.horaires} · {st.telephone}</p>
            <p className="text-xs text-muted">Dernière vérification : {ilYa(st.derniereVerification)}</p>
          </div>
          <p className="mt-3 text-xs text-muted">Le statut de partenariat est géré par la coordination de Jongoma Care après signature d&apos;un accord.</p>
        </Panneau>
      </div>
    </div>
  );
}
