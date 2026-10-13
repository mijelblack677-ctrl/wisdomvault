#!/usr/bin/env python3
"""Generate the Wisdom Vault Business Information document (.docx).

Every factual claim in this document is drawn from what the platform itself
publishes (Terms of Service, Privacy Policy, pricing page, consent flow and
published program rules). Details the operator must complete are marked with
square brackets like [ ... ] and must be filled in before the document is
circulated.

Usage:  python3 scripts/generate_business_info_docx.py
Output: Wisdom_Vault_Business_Information.docx  (in the project root)
"""

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor

DARK = RGBColor(0x1F, 0x1F, 0x1F)
NAVY = RGBColor(0x1F, 0x3A, 0x5F)
GREY = RGBColor(0x59, 0x59, 0x59)
GOLD = RGBColor(0x9A, 0x6A, 0x00)

OUT = "Wisdom_Vault_Business_Information.docx"


def set_base_styles(doc):
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.font.color.rgb = DARK
    normal.paragraph_format.space_after = Pt(8)
    normal.paragraph_format.line_spacing = 1.15

    for name, size, color, before, after in (
        ("Heading 1", 15, NAVY, 18, 8),
        ("Heading 2", 12.5, NAVY, 12, 6),
    ):
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)


def title_block(doc):
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = t.add_run("Wisdom Vault")
    r.font.size = Pt(30)
    r.font.bold = True
    r.font.color.rgb = NAVY

    s = doc.add_paragraph()
    r = s.add_run("Business Information & Transaction Summary")
    r.font.size = Pt(15)
    r.font.color.rgb = GOLD
    r.font.bold = True

    meta = doc.add_paragraph()
    r = meta.add_run(
        "Prepared for review by banks, mobile-money operators (Airtel Money, TNM Mpamba), "
        "the PayChangu payment gateway and other payment partners.\n"
        "Version 1.1  ·  September 2026  ·  Malawi"
    )
    r.font.size = Pt(10)
    r.font.color.rgb = GREY
    meta.paragraph_format.space_after = Pt(14)


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ""
        p = hdr[i].paragraphs[0]
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = NAVY
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            p = cells[i].paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(10)
    # ensure no extra empty paragraph after last cell paragraph
    for cell in table.rows[0].cells:
        for p in cell.paragraphs[1:]:
            p.clear()
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def bullets(doc, items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet")
        if isinstance(it, tuple):
            lead, rest = it
            r = p.add_run(lead)
            r.font.bold = True
            p.add_run(rest)
        else:
            p.add_run(it)


def body():
    doc = Document()

    # A4 page size with comfortable margins
    for sec in doc.sections:
        sec.page_width = Inches(8.27)
        sec.page_height = Inches(11.69)
        sec.left_margin = Inches(0.9)
        sec.right_margin = Inches(0.9)
        sec.top_margin = Inches(0.9)
        sec.bottom_margin = Inches(0.9)

    set_base_styles(doc)
    title_block(doc)

    # 1. Purpose -----------------------------------------------------------
    doc.add_heading("1. Purpose of This Document", level=1)
    doc.add_paragraph(
        "This document explains what Wisdom Vault is, how it operates, what its members pay for, "
        "and the controls the platform has in place. It is provided to help banks, mobile-money "
        "operators and payment partners review transactions connected to Wisdom Vault, and to "
        "answer questions that may arise when a transaction or account is reported as suspicious. "
        "It is an explanatory summary, not legal advice, and it does not replace the Wisdom Vault "
        "Terms of Service and Privacy Policy, which are published on our website and remain the "
        "documents that govern use of the platform."
    )

    # 2. Operator ----------------------------------------------------------
    doc.add_heading("2. Who Operates Wisdom Vault", level=1)
    doc.add_paragraph(
        "Wisdom Vault is a digital business operated from Malawi under the brand The Vault. "
        "The business is not yet formally registered as a company, and this document does not "
        "claim any company registration number. The operator's identity and contact details below "
        "can be verified with the payment gateway that processes Wisdom Vault payments."
    )
    bullets(doc, [
        ("Brand / platform: ", "Wisdom Vault"),
        ("Website: ", "https://wisdom-vault-peach.vercel.app"),
        ("Operator: ", "The Vault"),
        ("Business type: ", "digital / online business (independent, not yet a registered company)"),
        ("Country of operation: ", "Malawi"),
        ("Support email: ", "administration@wisdomvault.com"),
        ("WhatsApp / phone: ", "[support number to be added \u2014 until then, please use the support email]"),
        ("Physical / postal address: ", "available on request"),
    ])

    # 3. The product --------------------------------------------------------
    doc.add_heading("3. What Wisdom Vault Is \u2014 The Product", level=1)
    doc.add_paragraph(
        "Wisdom Vault is a paid digital learning platform. A member pays a membership fee to access "
        "curated learning content \u2014 courses, guides, ebooks and videos \u2014 across areas such as "
        "business and finance, technology, personal growth, relationships and practical skills. "
        "Depending on the plan chosen, a member's fee provides access to the platform's content "
        "library and features, which may include:"
    )
    bullets(doc, [
        "Access to the paid content library, including premium content packs that can also be "
        "purchased individually.",
        "Optional participation in the referral rewards program (described in section 6).",
        "Optional sponsored earning tasks offered on the platform from time to time.",
    ])
    doc.add_paragraph(
        "Wisdom Vault is not a bank, does not take deposits, does not pay interest, does not sell "
        "shares or \u201cinvestment packages\u201d, and does not promise any financial return on any fee. "
        "A membership is a purchase of access to content \u2014 the same kind of transaction as a "
        "subscription to an e-learning site, a magazine, or a streaming service."
    )

    # 4. Money flow ---------------------------------------------------------
    doc.add_heading("4. How Membership and Payments Work", level=1)
    doc.add_paragraph(
        "Creating an account is free and does not require payment. When a person registers, they are "
        "first asked to read and accept the Terms of Service and Privacy Policy, and are then shown a "
        "clear consent screen that states (among other things) that Wisdom Vault is a paid membership "
        "service. The screen has an \u201cI Agree\u201d button and a \u201cDisagree\u201d button; choosing "
        "\u201cDisagree\u201d ends the process and no account is created. The date and time of consent are "
        "recorded on the account."
    )
    doc.add_paragraph(
        "A member who wishes to join then chooses to pay the membership fee. The full amount is shown "
        "on the pricing page, on the registration page and again on the payment page before the member "
        "confirms. Payment is processed through PayChangu, a licensed Malawian payment gateway, using "
        "Airtel Money or TNM Mpamba. Every payment is initiated and authorized by the member on their "
        "own phone; Wisdom Vault cannot and does not debit anyone. Once the gateway confirms the "
        "payment, the member's account is activated for content access and the payment is recorded in "
        "the member's wallet history with the gateway reference."
    )
    doc.add_paragraph("A reviewer may encounter the following types of transactions:")
    add_table(doc,
        ["Transaction type", "What it is", "How it is initiated"],
        [
            ["Membership / registration fee",
             "Payment for membership and access to paid content. The amount the member pays is the "
             "amount published on the platform at the time they join.",
             "Voluntarily by the member on the Wisdom Vault website, authorized on their own phone."],
            ["Membership renewal",
             "Renewal of access after a membership period ends.",
             "Voluntarily by the member when they choose to renew. There are no automatic recurring "
             "charges; every renewal is a separate, member-authorized payment."],
            ["Premium pack purchase",
             "One-time purchase of a specific content pack (packs are currently priced individually "
             "in the platform).",
             "Voluntarily by the member."],
            ["Referral reward credit",
             "A fixed reward credited to a member's in-platform wallet when a person they referred "
             "completes registration and pays the membership fee.",
             "Automatic, only after the referred payment is verified by the gateway (rules in "
             "section 6)."],
            ["Wallet withdrawal",
             "Transfer of the member's own wallet balance to their mobile-money account.",
             "By the member, subject to the verification and minimums shown in the app."],
            ["Withdrawal refund / rejection",
             "Return of the full amount to the member's wallet when a withdrawal cannot be paid or is "
             "rejected.",
             "Automatic (failed payout) or administrative (rejected withdrawal)."],
        ],
    )

    # 5. Voluntary ----------------------------------------------------------
    doc.add_heading("5. Registration and Payment Are Voluntary", level=1)
    doc.add_paragraph(
        "A frequent question is whether people are pressured or forced to register and pay. They are "
        "not. Specifically:"
    )
    bullets(doc, [
        ("Free to say no: ", "Anyone can read the pricing and terms before deciding. Choosing not to "
         "register, or not to pay, has no consequence for the individual \u2014 they simply do not become "
         "a paying member."),
        ("Consent is explicit: ", "An account cannot be created without the person first confirming, "
         "on a dedicated consent screen, that they understand this is a paid service and accept the "
         "terms. The screen offers a clear \u201cDisagree\u201d option that cancels registration."),
        ("Payment requires the member's own action: ", "Every payment is authorized by the member on "
         "their own phone through their mobile-money provider. No deduction can occur without that "
         "action."),
        ("No lock-in: ", "Members can stop using the platform at any time, and can contact support to "
         "close their account."),
        ("Pressure is not part of the model: ", "Referral links are shared by individual members. We "
         "ask anyone who feels pressured or misled to contact us (section 9) before or after paying "
         "and we will review what happened. Because a payment can only be authorized by the member "
         "on their own phone, a payment that a member did not intend cannot be forced on them."),
    ])

    # 6. Referral -----------------------------------------------------------
    doc.add_heading("6. The Referral Rewards Program", level=1)
    doc.add_paragraph(
        "Wisdom Vault operates a referral (affiliate) program that rewards members who introduce new "
        "members. The rules are published on the platform and are the same for everyone:"
    )
    bullets(doc, [
        ("Eligibility: ", "a reward is paid only when the person referred completes registration, "
         "pays the membership fee, and that payment is verified by the gateway."),
        ("Amounts: ", "the current direct referral reward is MWK 7,000 per valid referral, with a "
         "smaller secondary reward of MWK 1,000 where the program's further level applies. Amounts "
         "and promotions are shown publicly on the platform."),
        ("Not an income promise: ", "referral rewards are not guaranteed, are never presented as a "
         "salary or business income, and depend entirely on successful, valid referrals. The Terms "
         "of Service state this expressly."),
        ("Recruiting is never required: ", "a member who never refers anyone keeps full content "
         "access and can still withdraw rewards earned in other ways. Membership value does not "
         "depend on recruiting."),
        ("Abuse is prohibited and monitored: ", "one account per person, no self-referrals, and no "
         "duplicate or fake accounts. Rewards can be withheld or reversed and accounts closed where "
         "the program is abused."),
    ])

    # 7. Wallet, withdrawals, refunds ---------------------------------------
    doc.add_heading("7. Wallet, Withdrawals and Payment Policy", level=1)
    bullets(doc, [
        ("Full history: ", "every credit and debit appears in the member's wallet history with a "
         "description and, for payments, the gateway reference."),
        ("Withdrawals: ", "a member can withdraw their own wallet balance to their mobile-money "
         "account. A minimum amount and a fee may apply; both are shown in the app before a "
         "withdrawal is submitted."),
        ("Failed payouts are credited back: ", "if the gateway cannot complete a withdrawal, the full "
         "amount is returned to the member's wallet automatically, and rejected withdrawals are "
         "returned in the same way. Money that never left the platform always comes back to the "
         "member."),
        ("Fees are non-refundable once paid: ", "membership and other fees are paid voluntarily, "
         "only after the member has confirmed on the consent screen at registration that they "
         "understand Wisdom Vault is a paid service and has seen the amount on the payment page. "
         "Members should therefore be sure they understand what they are buying before they pay. "
         "Nothing in this policy removes any right that cannot be excluded by law."),
        ("Account closure: ", "a member may stop using the platform and request account closure and "
         "deletion of their personal data at any time, as described in the Privacy Policy."),
    ])

    # 8. Controls -----------------------------------------------------------
    doc.add_heading("8. Anti-Fraud and Compliance Controls Already in Place", level=1)
    bullets(doc, [
        "Explicit, timestamped consent is captured at registration, including confirmation that the "
        "service is a paid membership.",
        "One account per person; duplicate and fraudulent accounts are detected and terminated.",
        "Accounts are activated only after the payment gateway verifies the payment.",
        "A full transaction ledger is kept: every payment has a gateway reference and every wallet "
        "transaction is itemized and retained.",
        "Referral abuse (self-referrals, duplicates, fake accounts) is detected, and rewards from "
        "abusive referrals are reversed.",
        "Withdrawals are verified so that money is only paid out to the account holder.",
        "Passwords are stored only as secure hashes, connections are encrypted, and full card or "
        "mobile-money credentials are never stored by the platform.",
    ])

    # 9. Contact / cooperation ----------------------------------------------
    doc.add_heading("9. Contact and Cooperation with Investigators", level=1)
    doc.add_paragraph(
        "Wisdom Vault takes reports of fraud seriously and cooperates with banks, mobile-money "
        "operators, PayChangu and the authorities. Where a member, partner or regulator raises a "
        "concern, we will:"
    )
    bullets(doc, [
        "respond promptly to lawful information requests with the relevant transaction, consent and "
        "account records (subject to data-protection requirements);",
        "suspend or close accounts that are reported as fraudulent while the matter is investigated;",
        "review the facts of any dispute and take the corrective action the facts support (for "
        "example, reversing a duplicate payment or returning money that the gateway never paid "
        "out).",
    ])
    doc.add_paragraph(
        "Members and third parties with questions or complaints should contact support:"
    )
    bullets(doc, [
        ("Support email: ", "administration@wisdomvault.com"),
        ("WhatsApp / phone: ", "[support number to be added \u2014 until then, please use the support email]"),
        ("For compliance enquiries from banks and mobile-money operators, please mark the message "
         "\u201cCompliance enquiry\u201d and include the transaction reference or account in question."),
    ])

    # 10. Good-faith statement ----------------------------------------------
    doc.add_heading("10. Statement of Good Faith", level=1)
    doc.add_paragraph(
        "Wisdom Vault operates openly: it sells access to learning content, tells prospective members "
        "clearly and in advance what they are paying for, records their consent, does not promise "
        "guaranteed income, does not force or mislead anyone into paying, records the consent of "
        "every member before any fee is paid, and explains its payment policy and transaction "
        "history transparently in this document. Anyone with a concern "
        "is encouraged to contact us directly before drawing conclusions, and we will do our best to "
        "resolve it quickly and fairly."
    )

    doc.add_paragraph()
    end = doc.add_paragraph()
    r = end.add_run(
        "This document was prepared by the operator of Wisdom Vault and reflects the platform's "
        "published terms and practices as of September 2026."
    )
    r.font.size = Pt(9)
    r.font.italic = True
    r.font.color.rgb = GREY

    doc.save(OUT)
    print(f"Saved {OUT}")


if __name__ == "__main__":
    body()
