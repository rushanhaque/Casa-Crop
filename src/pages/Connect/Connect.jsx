
import Cart from '../../components/Cart/Cart'
import Footer from '../../components/Footer/Footer'
import Lines from '../../components/Lines/Lines'
import Nav from '../../components/Nav/Nav'
import Progress from '../../components/Progress/Progress'
import { useReveal } from '../../lib/useReveal'
import s from './Connect.module.css'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name', required: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
]

const DETAIL = [
  { key: 'Export desk', value: 'connect@casaandcrop.com', href: 'mailto:connect@casaandcrop.com' },
  { key: 'Telephone', value: '+91 75792 39454', href: 'tel:+917579239454' },
  { key: 'Works', value: '14 Peetal Nagri, Civil Lines, Moradabad, Uttar Pradesh 244001', href: null },
  { key: 'Hours', value: 'Mon–Sat, 09:00–18:00 IST', href: null },
]

export default function Connect() {
  useReveal()

  return (
    <>
      <a className={s.skip} href="#enquiry">
        Skip to the contact form
      </a>

      <Nav current="Contact" />
      <Progress />

      <main className={s.page}>
        <section className={s.masthead} aria-labelledby="connect-title" data-scrub="sink">
          <Lines
            as="h1"
            className={s.title}
            id="connect-title"
            lines={['Get in touch.']}
            enter
            enterDelay={160}
            split="chars"
          />
          <p className={s.standfirst} data-reveal="rise" style={{ '--i': 1 }}>
            Send a drawing, a sample, or a photograph and a description. We will come
            back with a dimensional view, an alloy and finish recommendation, and a
            price against your quantity.
          </p>
        </section>

        <div className={s.body}>
          {/* ── The form ─────────────────────────────────── */}
          <section className={s.formWrap} id="enquiry" aria-labelledby="form-title">
            <h2 className={s.sectionKey} id="form-title" data-reveal="rise" style={{ '--i': 0 }}>
              Contact
            </h2>

            <div className={s.card} data-reveal="zoom">
              <form className={s.form} action="https://formsubmit.co/connect@casaandcrop.com" method="POST" aria-describedby="form-required">
                <input type="hidden" name="_subject" value="New enquiry from Casa and Crop" />
                <p className={s.formRequired} id="form-required" data-reveal="rise" style={{ '--i': 0 }}>
                  Fields marked <span aria-hidden="true">*</span>
                  <span className={s.srOnly}> asterisk</span> are required.
                </p>
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
                        placeholder=" "
                      />
                      <label className={s.label} htmlFor={field.name}>
                        {field.label}
                        {field.required ? <span aria-hidden="true"> *</span> : null}
                      </label>
                      <span className={s.fieldRule} aria-hidden="true" data-reveal="draw" style={{ '--i': i }} />
                    </p>
                  ))}
                </div>

                <p className={s.field} data-reveal="rise" style={{ '--i': 2 }}>
                  <textarea
                    className={s.textarea}
                    id="message"
                    name="message"
                    rows={5}
                    placeholder=" "
                  />
                  <label className={s.label} htmlFor="message">
                    Message
                  </label>
                  <span className={s.fieldRule} aria-hidden="true" data-reveal="draw" style={{ '--i': 2 }} />
                </p>

                <button className={s.submit} type="submit" data-pointer data-magnetic data-reveal="rise" style={{ '--i': 3 }}>
                  <span className={s.submitLabel}>Send message</span>
                  <span className={s.submitFill} aria-hidden="true" />
                  <span className={s.submitRule} aria-hidden="true" />
                </button>

                <p className={s.formNote} data-reveal="rise" style={{ '--i': 4 }}>
                  Or write directly to{' '}
                  <a className={s.inlineLink} href="mailto:connect@casaandcrop.com">
                    connect@casaandcrop.com
                  </a>
                  . Drawings in PDF, STEP or DWG.
                </p>
              </form>
            </div>
          </section>

          {/* ── The details ─────────────────────────────────── */}
          <aside className={s.aside}>
            <section aria-labelledby="detail-title">
              <h2 className={s.sectionKey} id="detail-title" data-reveal="rise" style={{ '--i': 0 }}>
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
          </aside>
        </div>
      </main>

      <Footer />
      <Cart />
    </>
  )
}
