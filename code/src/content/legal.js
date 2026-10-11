/**
 * Privacy policy and terms.
 *
 * ACCURACY RULE: the privacy policy must describe what the Worker actually
 * does, not what a template says. It is written against worker/index.js and
 * must be re-read whenever that file's data handling changes. Today the site
 * stores exactly four things per signup (address, timestamp, country, consent
 * flag) under a hashed key, keeps a per-IP rate-limit counter for
 * RATE_LIMIT_WINDOW_S (600 s), logs CSP violation reports, sets no cookies of its
 * own, and has backups of the list that are made by hand (nothing schedules
 * them) and pruned to BACKUP_RETENTION_DAYS when the next one runs. The Analytics
 * section follows CF_ANALYTICS_TOKEN, so it cannot claim a beacon that is not
 * loaded. See SYSTEM.md and LEGAL.md (data map).
 */

import { CF_ANALYTICS_TOKEN } from "./site.js";

export const LEGAL_EFFECTIVE = "11 October 2026";

/** Retention window, in days, for a stored subscriber record. Mirrors worker/index.js. */
export const RETENTION_DAYS = 730;

/** How long a daily backup of the list is kept. Mirrors worker/backup.js. */
export const BACKUP_RETENTION_DAYS = 30;

/** How long the per-IP rate-limit counter lives, in minutes. Mirrors RATE_LIMIT_WINDOW_S (600 s) in worker/index.js. */
export const RATE_LIMIT_WINDOW_MINUTES = 10;

/**
 * The Analytics section. It describes Cloudflare Web Analytics only when the
 * beacon is actually injected (CF_ANALYTICS_TOKEN set in site.js); otherwise it
 * says there is none. Turning analytics on also needs a new LEGAL_EFFECTIVE date.
 */
const ANALYTICS_PARAGRAPHS = CF_ANALYTICS_TOKEN
  ? [
      "We use Cloudflare Web Analytics to see roughly how many people visit and which pages they read. It is cookieless: it does not use client-side state, does not fingerprint visitors, and does not follow you to other sites. The data we see is aggregate — page views, referrers, countries and broad device categories — and cannot be traced back to an individual.",
    ]
  : [
      "This site does not use analytics. No analytics script loads, and we do not count or profile visitors. If that changes, this section will say so, and any analytics we add will be cookieless.",
    ];

export const PRIVACY = {
  title: "Privacy Policy",
  lede: "Vroe Labs collects as little as possible. This page describes exactly what that means, in plain language.",
  sections: [
    {
      heading: "The short version",
      paragraphs: [
        "If you only read the list below, you have the important part. We store your email address only if you type it into our form and tick the consent box. We set no cookies of our own, we do not track you across other websites, and we never sell or share your address.",
      ],
      list: [
        "No account, no login, no profile.",
        "No advertising, no cross-site tracking, no data sold or shared.",
        "One form, one field, and only if you choose to use it.",
        "Ask us to delete your details and we will, without asking why.",
      ],
    },
    {
      heading: "What we collect when you join the list",
      paragraphs: [
        "The early-access form is the only place this website collects anything about you. When you submit it, we store four things:",
      ],
      list: [
        "Your email address, so we can tell you when there is something worth knowing.",
        "The date and time you subscribed, so we have a record of when consent was given.",
        "The two-letter country code your request came from, provided by our hosting platform. We do not store your IP address alongside it.",
        "A note that you ticked the consent box.",
      ],
      after: [
        "That is the complete list for your signup. We do not ask for your name, and we do not attempt to work out who you are or where you work.",
        `To stop the form being abused, we also count submissions from each IP address. That counter is stored in Cloudflare Workers KV under a key that contains your IP address, is not linked to your email address, and deletes itself after ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
      ],
    },
    {
      heading: "How your address is stored",
      paragraphs: [
        "Records are held in Cloudflare Workers KV. Each entry is filed under a one-way cryptographic hash of your address rather than the address itself, so the stored list cannot be browsed by guessing email addresses.",
        `We keep a subscription record for up to ${RETENTION_DAYS} days from the date you subscribe, or until you ask us to remove it, whichever comes first.`,
        `We also keep backup copies of the list, so we can restore it if something goes wrong. Backups are made by hand, not on a schedule, and are kept on the founder's own computer. Each time a new backup is made, copies older than ${BACKUP_RETENTION_DAYS} days are deleted, so an older copy can remain until the next backup is made. If you ask us to remove your details, we delete them from the live list when we action your request, which we do within 30 days, and they drop out of the backups as those older copies are deleted.`,
      ],
    },
    {
      heading: "What we deliberately do not do",
      list: [
        "We do not write your email address into any log file or error report.",
        "We do not set advertising, analytics or preference cookies.",
        "We do not use session recording, heatmaps or fingerprinting.",
        "We do not send your details to any mailing-list provider, CRM or advertising network.",
      ],
    },
    {
      heading: "Bot protection",
      paragraphs: [
        "The form is protected by Cloudflare Turnstile, which checks that a submission comes from a person rather than an automated script. Turnstile processes your IP address and basic browser signals to make that decision. It is an alternative to a traditional CAPTCHA that does not ask you to label photographs. Cloudflare describes how it handles that data in its own privacy policy, and we do not control it.",
      ],
    },
    {
      heading: "Analytics",
      paragraphs: ANALYTICS_PARAGRAPHS,
    },
    {
      heading: "Hosting and server logs",
      paragraphs: [
        "This site is hosted on Cloudflare. As with any web host, Cloudflare processes technical request data — IP address, user agent, the page requested — in order to serve pages, block attacks and keep the site online. That processing is governed by Cloudflare's own privacy policy. Our application logs record whether a submission succeeded or failed, never the address involved.",
        "If your browser blocks something on a page because of our security policy (the Content Security Policy), it may send us a report. We log only the rule involved, the address that was blocked and the page it happened on, so we can fix the site, and we keep nothing else from the report. These logs are held in Cloudflare Workers Logs.",
      ],
    },
    {
      heading: "Who else sees your data",
      paragraphs: [
        "No one. We do not sell, rent, share or trade your email address. The only third party involved is Cloudflare, which hosts the site and stores the data on our behalf as a processor. If that ever changes, we will update this page before it does — not afterwards.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You can ask us at any time to tell you what we hold about you, to correct it, or to delete it. Email us and we will action it. There is no form to fill in and we will not ask you to justify the request.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "This site is not directed at children, and we do not knowingly collect information from anyone under 16. If you believe a child has subscribed, email us and we will remove the record.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "If we change what we collect or how we use it, we will update this page and change the effective date at the top. Material changes to how we treat addresses already on the list will be noted on this page.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions, corrections, deletion requests and complaints all go to the same address, and a person reads it: Dev Patel, founder of Vroe Labs.",
      ],
      contact: true,
    },
  ],
};

export const TERMS = {
  title: "Terms of Use",
  lede: "These terms cover the Vroe Labs website. They are deliberately short, because this site is a place to read about what we are building rather than a service you sign up to.",
  sections: [
    {
      heading: "What this site is",
      paragraphs: [
        "vroelabs.com is an informational website about Vroe Labs and the products we are working on. It is not itself a product, and using it creates no account and no ongoing service relationship.",
      ],
    },
    {
      heading: "Products described here are in development",
      paragraphs: [
        "Trove and Vero are described on this site as works in progress, and each carries a status label saying where it stands. Nothing here is an offer, a commitment to release, or a promise about features, pricing or timing. Plans change, and products described here may change substantially or not ship at all.",
        "Where a product is not yet available, we say so. Please do not treat anything on this site as a guarantee that a product exists or will exist.",
      ],
    },
    {
      heading: "Joining the list",
      paragraphs: [
        "Subscribing means we may email you occasionally about what we are building. It does not entitle you to early access, a beta place, or any particular product. You can ask to be removed at any time, and how we handle your address is set out in our privacy policy.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: ["When using this site, please do not:"],
      list: [
        "Attempt to gain unauthorised access to the site, its hosting, or any connected system.",
        "Submit other people's email addresses, or addresses you have no right to use.",
        "Use automated tools to scrape, overload, or probe the site beyond ordinary browsing.",
        "Interfere with the site's security features, or use it to distribute malware or unlawful material.",
      ],
      after: [
        "If you are a security researcher, the security policy sets out how to test and report responsibly. Good-faith research conducted within it is welcome, not a breach of these terms.",
      ],
    },
    {
      heading: "Our content",
      paragraphs: [
        "The text, design, images, code and brand marks on this site belong to Vroe Labs unless stated otherwise. You are welcome to link to us, quote us with attribution, and share what we publish. You may not republish substantial parts as your own or use our name or marks in a way that suggests we endorse something we do not. The site's source code is published under the Vroe Labs licence (PolyForm Strict 1.0.0): noncommercial use only, with no changes, derivative works or redistribution. The licence text is in the LICENSE file of the public repository.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: [
        "Where we link somewhere else, we do not control that destination and are not responsible for its content or its privacy practices. Their terms apply once you leave.",
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        "This site is provided as it is. We work to keep it accurate, available and secure, but we do not warrant that it will be uninterrupted, error-free, or that the information on it is complete or current at any given moment.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "To the extent the law allows, Vroe Labs is not liable for indirect or consequential loss arising from your use of this website. Nothing in these terms limits liability that cannot lawfully be limited.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of India, and the courts of India will have jurisdiction over any dispute arising from them.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms as the site grows. The effective date at the top of this page always reflects the current version.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: ["If anything here is unclear, ask us."],
      contact: true,
    },
  ],
};
