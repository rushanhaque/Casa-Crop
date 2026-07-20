import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './Connect.module.css'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true },
  { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization' },
  { name: 'country', label: 'Country', type: 'text', autoComplete: 'country-name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
]

const ENQUIRY = [
  'Sample set',
  'Production to our drawing',
  'Catalogue and price list',
  'Existing order',
  'Something else',
]

const DETAIL = [
  { key: 'Export desk', value: 'export@casaandcrop.com', href: 'mailto:export@casaandcrop.com' },
  { key: 'Telephone', value: '+91 591 245 8890', href: 'tel:+915912458890' },
  { key: 'Works', value: '14 Peetal Nagri, Civil Lines, Moradabad, Uttar Pradesh 244001', href: null },
  { key: 'Hours', value: 'Mon–Sat, 09:00–18:00 IST', href: null },
]

const TERMS = [
  { key: 'Incoterms', value: 'FOB, CIF, or ex-works' },
  { key: 'Minimum order', value: '250 pieces per SKU' },
  { key: 'Sampling', value: '18 days from approved drawing' },
  { key: 'Payment', value: '30% advance, balance against B/L' },
]

/**
 * The Connect page.
 *
 * A trade enquiry, not a contact form: a buyer needs to say what they
 * want made, in what alloy, to what standard, and where it is going.
 * The terms sit beside the form rather than behind a link, because
 * MOQ and Incoterms are the two questions that decide whether the
 * enquiry gets sent at all.
 */
export default function Connect() {
  useReveal()

  return (
    <>
      <a className={s.skip} href="#enquiry">
        Skip to the enquiry form
      </a>

      <Nav current="Connect" />
      <Progress />

      <main className={s.page}>
        <section className={s.masthead} aria-labelledby="connect-title" data-scrub="sink">
          <Lines
            as="h1"
            className={s.title}
            id="connect-title"
            lines={['Tell us what', 'you need made.']}
            enter
            enterDelay={160}
          />
          <p className={s.standfirst} data-reveal="rise" style={{ '--i': 1 }}>
            Send a drawing, a sample, or a photograph and a description. We will come
            back with a dimensional view, an alloy and finish recommendation, and a
            price against your quantity.
          </p>
        </section>

        <div className={s.body}>
          {/* ── The enquiry ─────────────────────────────────── */}
          <section className={s.formWrap} id="enquiry" aria-labelledby="form-title">
            <h2 className={s.sectionKey} id="form-title">
              Enquiry
            </h2>

            {/*  No endpoint is wired to this form yet. It is deliberately
                left without an action rather than pointed at a
                placeholder that would silently swallow a real buyer's
                enquiry — the export address above it works today, and
                this needs a form handler before launch. */}
            <form className={s.form} noValidate>
              <div className={s.fieldGrid}>
                {FIELDS.map((field, i) => (
                  <p className={s.field} key={field.name} data-reveal="rise" style={{ '--i': i }}>
                    <input
                      className={s.input}
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      required={field.required}
                      /*  A single space, not an empty string. The
                          floating label is driven by
                          :placeholder-shown, which only matches when a
                          placeholder actually exists. */
                      placeholder=" "
                    />
                    <label className={s.label} htmlFor={field.name}>
                      {field.label}
                      {field.required ? <span aria-hidden="true"> *</span> : null}
                    </label>
                    {/*  The sheet is ruled up before it is filled —
                        each line draws in as the form enters, walking
                        down the page in the order the fields are
                        completed. */}
                    <span className={s.fieldRule} aria-hidden="true" data-reveal="draw" style={{ '--i': i }} />
                  </p>
                ))}
              </div>

              <p className={s.field} data-reveal="rise" style={{ '--i': 4 }}>
                <select className={s.select} id="enquiry-type" name="enquiry-type" defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {ENQUIRY.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <label className={s.labelStatic} htmlFor="enquiry-type">
                  Regarding
                </label>
                <span className={s.fieldRule} aria-hidden="true" data-reveal="draw" style={{ '--i': 4 }} />
              </p>

              <p className={s.field} data-reveal="rise" style={{ '--i': 5 }}>
                <textarea
                  className={s.textarea}
                  id="message"
                  name="message"
                  rows={5}
                  placeholder=" "
                />
                <label className={s.label} htmlFor="message">
                  Quantity, alloy, finish, destination
                </label>
                <span className={s.fieldRule} aria-hidden="true" data-reveal="draw" style={{ '--i': 5 }} />
              </p>

              <button className={s.submit} type="submit">
                <span className={s.submitLabel}>Send enquiry</span>
                <span className={s.submitFill} aria-hidden="true" />
                <span className={s.submitRule} aria-hidden="true" />
              </button>

              <p className={s.formNote}>
                Or write directly to{' '}
                <a className={s.inlineLink} href="mailto:export@casaandcrop.com">
                  export@casaandcrop.com
                </a>
                . Drawings in PDF, STEP or DWG.
              </p>
            </form>
          </section>

          {/* ── The details ─────────────────────────────────── */}
          <aside className={s.aside}>
            <section aria-labelledby="detail-title">
              <h2 className={s.sectionKey} id="detail-title">
                The desk
              </h2>
              <dl className={s.detailList}>
                {DETAIL.map((item, i) => (
                  <div className={s.detail} key={item.key} data-reveal="margin" style={{ '--i': i }}>
                    <dt className={s.detailKey}>{item.key}</dt>
                    <dd className={s.detailValue}>
                      {item.href ? (
                        <a className={s.detailLink} href={item.href}>
                          <span>{item.value}</span>
                          <span className={s.detailRule} aria-hidden="true" />
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="terms-title" id="samples">
              <h2 className={s.sectionKey} id="terms-title">
                Terms
              </h2>
              <dl className={s.detailList}>
                {TERMS.map((item, i) => (
                  <div className={s.detail} key={item.key} data-reveal="margin" style={{ '--i': i }}>
                    <dt className={s.detailKey}>{item.key}</dt>
                    <dd className={s.detailValue}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  )
}
