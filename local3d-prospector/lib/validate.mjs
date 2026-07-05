// Validazione del content model + regole di compliance codificate come test.
// Una policy legale sopravvive alla fretta solo se è un controllo automatico che blocca la build.
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { schema } from './config.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
let _validator = null;
function validator() {
  if (!_validator) _validator = ajv.compile(schema());
  return _validator;
}

// Regole extra oltre allo schema JSON: le invarianti che ci tengono legali.
function complianceRules(biz) {
  const errors = [];

  // 1. In build 'live' vietate foto non fornite dal cliente (copyright degli autori).
  if (biz.meta?.build_mode === 'live') {
    for (const img of biz.gallery || []) {
      if (img.rights !== 'client_provided') {
        errors.push(`gallery: foto con rights='${img.rights}' vietata in build LIVE (solo client_provided)`);
      }
    }
    // In live servono foto vere del cliente — TRANNE nel live 'provisional' su sottodominio
    // (subito dopo il pagamento, prima che il cliente mandi le foto).
    if (!biz.meta.provisional && !(biz.gallery || []).some((g) => g.rights === 'client_provided')) {
      errors.push('gallery: build LIVE richiede almeno una foto fornita dal cliente');
    }
  }

  // 2. Ogni testimonial deve essere anonimizzato o autorizzato: mai nome+cognome pieni ripubblicati.
  for (const t of biz.social_proof?.testimonials || []) {
    if (/^[A-ZÀ-Ý][a-zà-ÿ]+ [A-ZÀ-Ý][a-zà-ÿ]{2,}$/.test(t.author.trim())) {
      errors.push(`testimonial: autore '${t.author}' sembra nome+cognome completo — anonimizzare (es. 'Marco R.')`);
    }
  }

  // 3. L'email usata per l'outreach a freddo deve essere generica, mai nominativa.
  const email = biz.contacts?.email;
  if (email && email.kind === 'nominative') {
    errors.push(`contacts.email: indirizzo nominativo '${email.value}' non ammesso per l'outreach a freddo`);
  }

  // 4. Nessun claim senza provenienza: hero/claim deve derivare da dati, non essere inventato.
  //    (Enforced by schema source fields; qui verifichiamo la coerenza del build_mode con la cta.mode.)
  if (biz.meta?.build_mode && biz.cta?.mode && biz.meta.build_mode !== biz.cta.mode) {
    errors.push(`incoerenza: meta.build_mode='${biz.meta.build_mode}' ma cta.mode='${biz.cta.mode}'`);
  }

  return errors;
}

export function validateBusiness(biz) {
  const v = validator();
  const schemaOk = v(biz);
  const schemaErrors = schemaOk ? [] : v.errors.map((e) => `${e.instancePath || '/'} ${e.message}`);
  const ruleErrors = complianceRules(biz);
  const errors = [...schemaErrors, ...ruleErrors];
  return { ok: errors.length === 0, errors };
}
