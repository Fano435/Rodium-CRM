import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatutContact } from "@generated/prisma/enums";
import { contactFormSchema, type ContactFormInput, type ContactFormValues } from "../schema/contact.schema";

type ContactFormProps = {
  defaultValues?: Partial<ContactFormInput>;
  onSubmit: (values: ContactFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

export function ContactForm({ defaultValues, onSubmit, onCancel, isSubmitting }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormInput, unknown, ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nom: "",
      telephone: "",
      entreprise: "",
      score: 0,
      statut: StatutContact.PROSPECT,
      ...defaultValues,
    },
  });

  return (
    <form className="cf-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="cf-field">
        <label htmlFor="nom">Nom complet</label>
        <input id="nom" {...register("nom")} placeholder="Jean Dupont" />
        {errors.nom && <span role="alert">{errors.nom.message}</span>}
      </div>

      <div className="cf-field">
        <label htmlFor="telephone">Telephone</label>
        <input id="telephone" {...register("telephone")} placeholder="06 00 00 00 00" />
        {errors.telephone && <span role="alert">{errors.telephone.message}</span>}
      </div>

      <div className="cf-field">
        <label htmlFor="entreprise">Entreprise</label>
        <input id="entreprise" {...register("entreprise")} placeholder="Optionnel" />
      </div>

      <div className="cf-field">
        <label htmlFor="score">Score</label>
        <input id="score" type="number" {...register("score", { valueAsNumber: true })} />
        {errors.score && <span role="alert">{errors.score.message}</span>}
      </div>

      <div className="cf-field">
        <label htmlFor="statut">Statut</label>
        <select id="statut" {...register("statut")}>
          {Object.values(StatutContact).map((statut) => (
            <option key={statut} value={statut}>
              {statut}
            </option>
          ))}
        </select>
      </div>

      <div className="cf-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          Enregistrer
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
