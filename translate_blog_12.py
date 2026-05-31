"""
Translation-only pass for blog #12 with SSL verification disabled.
Reads the EN content definition, translates section by section,
then rebuilds both HTML files and Word docs.
"""
import sys, io, os, json, time, re, ssl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import urllib.request
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# Read key from .env — never hardcode
def load_env_key():
    env_path = r"C:\Users\Lenovo\Documents\Ensign - Team\.env"
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith('GOOGLE_API_KEY='):
                return line.strip().split('=', 1)[1]
    raise ValueError("GOOGLE_API_KEY not found in .env")

GOOGLE_API_KEY = load_env_key()
SLUG = "email-marketing-automation-saudi-businesses"
PUB_DATE = "2026-05-17T09:00:00+03:00"
ARCHIVE_DIR = r"C:\Users\Lenovo\Desktop\Ensign AI Marketing Agency\blogs\Ensign Blogs - current\Email Marketing Automation for Saudi Businesses"
EN_OUT = r"C:\Users\Lenovo\Documents\Ensign-Website\blog\email-marketing-automation-saudi-businesses.html"
AR_OUT = r"C:\Users\Lenovo\Documents\Ensign-Website\ar\blog\email-marketing-automation-saudi-businesses.html"

os.makedirs(ARCHIVE_DIR, exist_ok=True)

# SSL context that bypasses cert verification (Windows cert store issue)
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

# ─── English Content (identical to build_blog_12.py) ─────────────────────
EN_TITLE = "Email Marketing Automation for Saudi Businesses: Build a System That Sells While You Sleep"
EN_META  = "Email returns 36 SAR for every 1 SAR spent. Most Saudi businesses send broadcast newsletters and wonder why nothing converts. Here is how to build a system that works differently."
EN_H1    = "Email Marketing Automation for Saudi Businesses"

EN_SECTIONS = [
    ("p", "Email marketing returns $36 for every $1 spent. That is the highest ROI of any marketing channel by a significant margin. Yet most Saudi businesses treat email as a broadcast tool: send a newsletter, wait for clicks, repeat."),
    ("p", "The businesses generating consistent revenue from email are not doing email marketing. They are running email automation: sequences that trigger based on behavior, adapt to each contact, and close deals without anyone manually pressing send."),
    ("p", "This guide explains exactly what that looks like, what your data needs to support it, and where the real results come from in practice."),

    ("h2", "Broadcast vs Automation: The Distinction That Changes Everything"),
    ("p", "Most email programs in Saudi businesses follow a simple pattern: collect addresses, send a newsletter every few weeks, occasionally promote a product. Response rates are low, unsubscribes accumulate, and the list gradually becomes a liability rather than an asset."),
    ("p", "Email automation works differently. Instead of sending to everyone on a schedule, automated sequences trigger based on what each contact actually does: visiting a pricing page, opening a specific email but not replying, requesting a demo and going quiet for 10 days. The system responds to real behavior. That is why automated sequences generate 320% more revenue than broadcast emails, according to Campaign Monitor."),
    ("p", "The technical difference is small. The business difference is significant. Broadcast email is a megaphone. Automated email is a conversation that scales."),

    ("h2", "The 5 Sequences Every Saudi Business Needs"),

    ("h3", "1. The Welcome Sequence (Days 0 to 7)"),
    ("p", "The moment someone joins your list is the highest-engagement window you will ever have. Most businesses send one welcome email and move on. A proper welcome sequence delivers 3 to 5 emails over the first week: what the business does, why it exists, what the contact can expect, and one specific offer or resource that tests buying intent early. Welcome sequences have 4x higher open rates than standard campaigns, according to Experian. Most Saudi businesses do not have one."),

    ("h3", "2. The Lead Nurturing Sequence (Days 7 to 60)"),
    ("p", "Not everyone who joins your list is ready to buy. Lead nurturing sequences keep contacts warm during the consideration window. Each email addresses a specific objection or question: cost concerns, implementation complexity, trust gaps. The sequence runs automatically based on where the contact is in the funnel, not on the calendar. Nurtured leads make 47% larger purchases than non-nurtured leads (Annuitas Group). The sequence is how you turn interest into intent."),

    ("h3", "3. The Re-engagement Sequence (For Contacts Inactive 60+ Days)"),
    ("p", "An inactive email list is expensive: it damages deliverability, inflates costs, and provides no data on actual interest. Re-engagement sequences identify contacts who have not opened in 60 days and run a targeted campaign to either re-activate them or clean them from the list. The goal is a healthy list, not a large one. Companies that clean their lists regularly see 25% higher delivery rates and better overall performance (Mailchimp data)."),

    ("h3", "4. The Abandoned Sequence (For Mid-Funnel Drop-offs)"),
    ("p", "Someone requests a demo and does not book. Someone downloads a guide and never responds to the follow-up. Someone clicks your pricing page three times in a week and goes quiet. Abandoned sequences catch these mid-funnel drop-offs and re-engage them with specific, relevant content. Abandoned cart emails in e-commerce have a 45% open rate and recover an average of 15% of otherwise-lost sales (Klaviyo). The logic applies equally to service businesses with a consultation or proposal stage."),

    ("h3", "5. The Post-Purchase Sequence (For Existing Clients)"),
    ("p", "Selling to an existing client costs 5x to 25x less than acquiring a new one. Post-purchase sequences do three things: confirm the client made the right decision, deliver value early in the relationship, and identify upsell and cross-sell opportunities before the client goes to a competitor. Businesses with structured post-purchase sequences see 20 to 40% higher client lifetime value than those relying on manual account management."),

    ("h2", "What Your Data Needs to Look Like First"),
    ("p", "Email automation produces results proportional to data quality. A sequence built on incomplete or messy CRM data does not underperform. It performs confidently in the wrong direction: wrong timing, wrong content, wrong audience."),
    ("p", "Before building sequences, three data requirements need to be met:"),
    ("strong_p", "Clean contact records. Every contact needs an accurate email, company size, industry, and lead source. Contacts missing two or more of these fields cannot be segmented properly and will receive generic sequences instead of targeted ones."),
    ("strong_p", "Behavioral tracking. Your CRM needs to record what contacts actually do: which emails they open, which pages they visit, which offers they click. Without this, your sequences are sending to guesses instead of signals."),
    ("strong_p", "Stage definitions. Every contact needs a clearly defined funnel stage: new subscriber, warm lead, qualified opportunity, active client, churned client. Without stage definitions, sequences cannot trigger correctly and contacts receive the wrong messages at the wrong time."),
    ("p", "Most Saudi businesses that approach us with email automation goals have none of these three in place. The first work is always data architecture, not sequence writing. Building automation on dirty data is not a shortcut. It is how you burn your list."),

    ("h2", "What the Numbers Actually Show"),
    ("p", "Klaviyo analyzed 7,000 brands using automated email sequences vs manual sending. Brands with automation in place generated 28% more revenue from email than those relying on broadcast alone, controlling for list size and industry."),
    ("p", "Omnisend found that automated sequences, which represent approximately 2% of total email sends, account for 29% of total email orders. The volume is small. The efficiency is disproportionate."),
    ("p", "For reference on Saudi market specifically: email penetration in the Kingdom sits at 97% among working professionals, and average inbox check frequency is 7 times per day according to Statista 2025 data. The audience is there. The infrastructure to reach them intelligently is what most businesses lack."),
    ("p", "At the enterprise level, the results scale further. A financial services firm in the Gulf running a full five-sequence automation stack reported a 62% reduction in cost per qualified lead compared to outbound calling, with a 4.3x increase in conversion rate from first contact to proposal. The automation replaced approximately 40 hours of manual follow-up per week across their sales team."),

    ("h2", "Where Email Automation Fails in Practice"),
    ("p", "The failure modes are consistent across markets and business sizes."),
    ("strong_p", "Personalization theater. Adding [First Name] to a subject line is not personalization. Real personalization means content that changes based on what the contact actually did: different body text for a contact who visited the enterprise pricing page vs one who downloaded the SME guide. Most automation tools can do this. Most businesses do not configure it."),
    ("strong_p", "Sequence length anxiety. Businesses fear being seen as spammy and cut sequences short. A welcome sequence that ends after one email is not a sequence. It is a single email. The data consistently shows that well-written sequences of 5 to 7 emails perform better than 1 to 2 email sequences, as long as each email delivers specific value."),
    ("strong_p", "No suppression logic. Running a re-engagement sequence and a lead nurturing sequence simultaneously on the same contact creates confusion and damages trust. Proper suppression logic ensures contacts receive one sequence at a time, relevant to their current stage. Most setups skip this step and then wonder why unsubscribe rates climb."),
    ("strong_p", "Ignoring deliverability. Email deliverability is infrastructure. SPF, DKIM, and DMARC records need to be configured correctly for emails to reach inboxes. Sender reputation needs to be maintained by removing non-engagers regularly. A well-written sequence sitting in spam folders returns zero. This is a technical requirement that most marketers delegate to IT without verifying the outcome."),

    ("h2", "What Changes When You Get It Right"),
    ("p", "When data is clean, sequences are properly configured, and deliverability is maintained, email automation becomes the most reliable revenue channel in the business. It runs without manual intervention. It scales without proportional cost. And unlike paid ads, it does not stop the moment the budget pauses."),
    ("p", "The shift is not about sending more email. It is about sending the right email to the right contact at the moment their behavior signals they are ready for the next conversation. That is the difference between a list that costs money and a list that makes money."),

    ("h2", "What Ensign Builds"),
    ("p", "Ensign designs and deploys email automation infrastructure for businesses in Saudi Arabia and the Gulf. The work starts with data architecture: cleaning your CRM, defining contact stages, and configuring behavioral tracking. It then moves to sequence design: mapping every sequence to actual funnel stages and writing content calibrated to each. Technical setup follows: deliverability configuration, automation platform integration, and suppression logic. Finally, a measurement layer tracks which sequences are working and where drop-offs occur."),
    ("p", 'We do not write sequences for broken funnels. The infrastructure has to be in place first. If you want to understand where your email program currently stands, <a href="https://cal.com/ensign-ai-agency-q4mmzg/30min" target="_blank" rel="noopener noreferrer" data-event-name="book_call_click" data-cta-location="footer">book a call</a>. The audit is free.'),
]

EN_FAQ = [
    ("What is the difference between email marketing and email automation?",
     "Email marketing typically refers to broadcast campaigns: newsletters, promotions, and announcements sent to a list on a schedule. Email automation uses behavioral triggers to send specific messages to specific contacts at specific moments: when someone visits a pricing page, opens an email but does not reply, or goes quiet after a demo request. Automated sequences generate 320% more revenue than broadcast campaigns because they respond to actual intent rather than a calendar."),
    ("How long does it take to set up email automation properly?",
     "For a business with clean CRM data and an existing email platform, a full five-sequence automation stack typically takes 4 to 6 weeks to design, write, configure, and test. If the CRM needs cleanup first, add 2 to 4 weeks. Businesses that skip the data cleanup phase and go straight to sequence building typically rebuild within 6 months after performance disappoints."),
    ("What email platform should Saudi businesses use?",
     "Platform choice depends on what your CRM supports natively. Klaviyo is the strongest for e-commerce. HubSpot or ActiveCampaign work well for B2B service businesses with complex funnels. Mailchimp is suitable for businesses starting out with simpler sequences. The platform matters less than the data architecture supporting it. Any major platform can run effective automation if the underlying data is clean and behavioral tracking is configured."),
    ("How many emails should a sequence contain?",
     "Welcome sequences: 4 to 6 emails over 7 to 10 days. Lead nurturing: 6 to 10 emails over 30 to 60 days, spaced further apart as the sequence progresses. Re-engagement: 3 to 4 emails over 14 days, with a clear unsubscribe option on the final one. Abandoned: 2 to 3 emails over 5 to 7 days. Post-purchase: 5 to 8 emails over 30 to 60 days. These are benchmarks. Every business needs to test its own audience response and adjust accordingly."),
    ("What makes email deliverability different from email sending?",
     "Sending is the action. Deliverability is whether the email reaches an inbox or a spam folder. Three technical configurations determine deliverability: SPF (Sender Policy Framework), which verifies your domain is authorized to send email; DKIM (DomainKeys Identified Mail), which adds a cryptographic signature to emails to prove they have not been altered; and DMARC, which tells receiving servers what to do with messages that fail SPF or DKIM checks. Without all three correctly configured, even excellent email content may never reach its intended recipients."),
]

EN_RELATED = [
    ("CRM Setup for Saudi Businesses: The Foundation Before the Automation", "/blog/crm-setup-saudi-businesses.html"),
    ("5 AI Marketing Automations Every Saudi Business Should Be Running in 2026", "/blog/ai-marketing-automations-saudi-business-2026.html"),
    ("Agentic AI in Marketing: What It Actually Means (Not Another Chatbot)", "/blog/agentic-ai-marketing-what-it-means-2026.html"),
]

# ─── Gemini with SSL bypass ────────────────────────────────────────────────
def gemini_translate(text, retries=3):
    prompt = f"ترجم النص التالي إلى العربية بصيغة أكثر بلاغة ودقة. أعطني ترجمة واحدة فقط، بدون خيارات بديلة، بدون شرح، بدون علامات markdown، النص العربي فقط:\n\n{text}"
    payload = {
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'thinkingConfig': {'thinkingBudget': 0}}
    }
    data = json.dumps(payload).encode('utf-8')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req, context=SSL_CTX, timeout=60)
            result = json.loads(resp.read().decode('utf-8'))
            ar = result['candidates'][0]['content']['parts'][0]['text'].strip()
            time.sleep(1.0)
            return ar
        except Exception as e:
            print(f"  Gemini error (attempt {attempt+1}): {e}", flush=True)
            time.sleep(2)
    return text

# ─── Translate ─────────────────────────────────────────────────────────────
print("Translating title...", flush=True)
AR_TITLE = gemini_translate(EN_TITLE)
print(f"  {AR_TITLE[:70]}", flush=True)

print("Translating meta...", flush=True)
AR_META = gemini_translate(EN_META)

print("Translating H1...", flush=True)
AR_H1 = gemini_translate(EN_H1)

AR_SECTIONS = []
for i, (typ, content) in enumerate(EN_SECTIONS):
    if '<a ' in content:
        # Translate only the non-HTML part then reassemble
        print(f"  [{i+1}/{len(EN_SECTIONS)}] link paragraph (partial translate)...", flush=True)
        # Extract text before the <a> tag
        before = content[:content.index('<a ')]
        ar_before = gemini_translate(before)
        after_start = content.index('</a>') + 4
        after = content[after_start:]
        link_html = content[len(before):after_start]
        ar_after = gemini_translate(after) if after.strip() else after
        AR_SECTIONS.append((typ, ar_before + link_html + ar_after))
        continue
    print(f"  [{i+1}/{len(EN_SECTIONS)}] {typ}: {content[:45]}...", flush=True)
    ar = gemini_translate(content)
    AR_SECTIONS.append((typ, ar))
    print(f"    -> {ar[:55]}", flush=True)

print("\nTranslating FAQ...", flush=True)
AR_FAQ = []
for i, (q, a) in enumerate(EN_FAQ):
    print(f"  Q{i+1} question...", flush=True)
    ar_q = gemini_translate(q)
    print(f"  Q{i+1} answer...", flush=True)
    ar_a = gemini_translate(a)
    AR_FAQ.append((ar_q, ar_a))

print("\nTranslating related links...", flush=True)
AR_RELATED = []
for label, url in EN_RELATED:
    ar_label = gemini_translate(label)
    AR_RELATED.append((ar_label, url.replace('/blog/', '/ar/blog/')))

print("\nAll translations complete.", flush=True)

# ─── Build article HTML ────────────────────────────────────────────────────
def build_article_html(sections, faq, related, lang='en'):
    lines = []
    for typ, content in sections:
        if typ == 'p':
            lines.append(f'      <p>{content}</p>')
        elif typ == 'h2':
            lines.append(f'      <h2>{content}</h2>')
        elif typ == 'h3':
            lines.append(f'      <h3>{content}</h3>')
        elif typ == 'strong_p':
            m = re.match(r'^([^.:]+[.:])', content)
            if m:
                bold = m.group(1)
                rest = content[len(bold):]
                lines.append(f'      <p><strong>{bold}</strong>{rest}</p>')
            else:
                lines.append(f'      <p><strong>{content}</strong></p>')
        lines.append('')
    lines.append('      <!-- Internal links -->')
    lines.append('      <div class="blog-post-related">')
    lines.append(f'        <h3>{"قراءات ذات صلة" if lang == "ar" else "Related Reading"}</h3>')
    lines.append('        <ul>')
    for label, url in related:
        lines.append(f'          <li><a href="{url}">{label}</a></li>')
    lines.append('        </ul>')
    lines.append('      </div>')
    lines.append('')
    lines.append('      <!-- FAQ Section -->')
    lines.append('      <div class="blog-post-faq">')
    lines.append(f'        <h2>{"أسئلة شائعة" if lang == "ar" else "Frequently Asked Questions"}</h2>')
    lines.append('')
    for q, a in faq:
        lines.append('        <details class="faq-item">')
        lines.append(f'          <summary>{q}</summary>')
        lines.append(f'          <p>{a}</p>')
        lines.append('        </details>')
        lines.append('')
    lines.append('      </div>')
    return '\n'.join(lines)

EN_ARTICLE = build_article_html(EN_SECTIONS, EN_FAQ, EN_RELATED, lang='en')
AR_ARTICLE = build_article_html(AR_SECTIONS, AR_FAQ, AR_RELATED, lang='ar')

# ─── Build full page HTML ──────────────────────────────────────────────────
def build_html(lang, title, meta, h1, article_body, pub_date, slug):
    ar_href = f"https://ensignksa.com/ar/blog/{slug}.html"
    en_href = f"https://ensignksa.com/blog/{slug}.html"
    canonical = en_href if lang == 'en' else ar_href
    css_path = "../css/blog-post.css?v=3" if lang == 'en' else "../../css/blog-post.css?v=3"
    fav = "../" if lang == 'en' else "../../"
    img_src = f"../assets/blog/{slug}-featured.png" if lang == 'en' else f"../../assets/blog/{slug}-featured.png"
    logo_src = "../assets/logos/logo-main.png" if lang == 'en' else "../../assets/logos/logo-main.png"
    home_href = "../" if lang == 'en' else "../../ar/"
    blog_href = "../blog/" if lang == 'en' else "../../ar/blog/"
    js_path = "../js/main.js?v=3" if lang == 'en' else "../../js/main.js?v=3"
    dir_attr = 'dir="rtl" ' if lang == 'ar' else ''
    footer_dir = 'dir="ltr"' if lang == 'ar' else ''
    og_locale = "ar_SA" if lang == 'ar' else "en_US"
    og_locale_alt = "en_US" if lang == 'ar' else "ar_SA"

    tag_date = "May 17, 2026" if lang == 'en' else "17 مايو 2026"
    tag_read = "10 min read" if lang == 'en' else "10 دقائق قراءة"
    tag_cat = "Email Marketing" if lang == 'en' else "التسويق بالبريد الإلكتروني"
    img_alt = ("Email automation pipeline showing 5 sequences connected by teal data flows on dark background"
               if lang == 'en' else
               "خط أنابيب أتمتة البريد الإلكتروني يُظهر 5 تسلسلات متصلة بتدفقات بيانات فيروزية على خلفية داكنة")
    cta_label = "Start Now" if lang == 'en' else "ابدأ الآن"
    cta_title = "Stop broadcasting. Start converting." if lang == 'en' else "توقف عن البث. ابدأ بالتحويل."
    cta_sub = ("Your email list is either making money or costing money. The difference is how it is set up. Book a call and find out where yours stands."
               if lang == 'en' else
               "قائمتك البريدية إما أنها تدرّ مالاً أو تُكلّف مالاً. الفارق يكمن في طريقة إعدادها. احجز مكالمة واكتشف أين تقف.")
    cta_btn = "Book a Call" if lang == 'en' else "احجز مكالمة"
    cta_nav = "Book a Call" if lang == 'en' else "احجز مكالمة"
    # cta-card block (MANDATORY on every blog — see CLAUDE.md)
    cta_card_title = ("Make Your Email List a Revenue Channel, Not a Newsletter" if lang == 'en'
                      else "حوّل قائمة بريدك الإلكتروني إلى قناة إيرادات، لا مجرد نشرة")
    cta_card_sub = ("Email is still the highest-ROI channel in marketing when the automation, segmentation, and copy are built right. Let us audit yours and show you exactly where revenue is leaking." if lang == 'en'
                    else "لا يزال البريد الإلكتروني أعلى قنوات التسويق عائداً، شرط أن تُبنى الأتمتة والتقسيم والمحتوى بشكل صحيح. دعنا نراجع نظامك ونوضّح لك أين يتسرّب العائد بالضبط.")
    book_path = "/book.html" if lang == 'en' else "/ar/book.html"
    cta_btn_book = "Book a Discovery Call" if lang == 'en' else "احجز موعداً الآن"
    cta_btn_proposal = "Request a Proposal" if lang == 'en' else "راسلنا لطلب عرض أسعار"
    cta_btn_whatsapp = "WhatsApp Us" if lang == 'en' else "تواصل معنا عبر واتساب"
    lang_switch = (f'<a href="{ar_href}" class="nav-lang" hreflang="ar">العربية</a>' if lang == 'en'
                   else f'<a href="{en_href}" class="nav-lang" hreflang="en">English</a>')
    footer_tagline = ("الطبقة الذكية التي تعتمدها الشركات الحديثة للنمو." if lang == 'ar'
                      else "The intelligent layer modern businesses use to grow.")

    if lang == 'ar':
        svc_lbl, co_lbl, conn_lbl = "الخدمات", "الشركة", "تواصل"
        ai_l, ag_l, os_l, v_l = "/ai-solutions.html", "/agency.html", "/ensign-os.html", "/vision-2030.html"
        ab_l, wk_l, ca_l, bl_l = "/ar/about.html", "/ar/work.html", "/ar/careers.html", "/ar/blog/"
        ai_t, ag_t = "حلول AI", "الوكالة"
        ab_t, wk_t, ca_t, bl_t = "من نحن", "أعمالنا", "الوظائف", "المدونة"
        footer_copy = "© 2026 مؤسسة إنسيان للدعاية والإعلان. جميع الحقوق محفوظة."
        priv_t, terms_t = "سياسة الخصوصية", "الشروط والأحكام"
        email_t = "راسلنا"
    else:
        svc_lbl, co_lbl, conn_lbl = "Services", "Company", "Connect"
        ai_l, ag_l, os_l, v_l = "../ai-solutions.html", "../agency.html", "../ensign-os.html", "../vision-2030.html"
        ab_l, wk_l, ca_l, bl_l = "../about.html", "../work.html", "../careers.html", "../blog/"
        ai_t, ag_t = "AI Solutions", "Agency"
        ab_t, wk_t, ca_t, bl_t = "About", "Work", "Careers", "Blog"
        footer_copy = "© 2026 Ensign Establishment for Advertising. All rights reserved."
        priv_t, terms_t = "Privacy Policy", "Terms"
        email_t = "Email Us"

    return f"""<!DOCTYPE html>
<html lang="{lang}" {dir_attr}>
<head>
<style id="flash-fix">html,body{{background:#07111E;color:#F2EFE8}}.reveal{{animation:revealFallback 0s linear 4s forwards}}@keyframes revealFallback{{to{{opacity:1;transform:none}}}}</style>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);}})(window,document,'script','dataLayer','GTM-TTFT7PF7');</script>
<!-- End Google Tag Manager -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Ensign AI Marketing Agency</title>
<meta name="description" content="{meta}">
<link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="en" href="{en_href}">
<link rel="alternate" hreflang="ar" href="{ar_href}">
<link rel="alternate" hreflang="x-default" href="{en_href}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta}">
<meta property="og:image" content="https://ensignksa.com/assets/blog/{slug}-featured.png">
<meta property="og:locale" content="{og_locale}">
<meta property="og:site_name" content="Ensign AI Marketing Agency">
<meta property="og:locale:alternate" content="{og_locale_alt}">
<meta property="article:published_time" content="{pub_date}">
<meta property="article:author" content="Ensign AI Marketing Agency">
<script>
  (function() {{
    var m = document.querySelector('meta[property="article:published_time"]');
    if (m && new Date() < new Date(m.content)) {{
      window.location.replace(document.documentElement.lang === 'ar' ? '/ar/blog/' : '/blog/');
    }}
  }})();
</script>
<meta property="article:section" content="Email Marketing">
<meta property="article:tag" content="Email Automation">
<meta property="article:tag" content="Marketing Automation">
<meta property="article:tag" content="Saudi Arabia">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ensignksa">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{meta}">
<meta name="twitter:image" content="https://ensignksa.com/assets/blog/{slug}-featured.png">
<meta name="robots" content="index, follow">
<meta name="author" content="Ensign AI Marketing Agency">
<meta name="geo.region" content="SA">
<meta name="geo.placename" content="Riyadh">
<link rel="icon" type="image/x-icon" href="{fav}favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="{fav}favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="{fav}favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="{fav}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=JetBrains+Mono:wght@400;500&display=swap" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=JetBrains+Mono:wght@400;500&display=swap"></noscript>
<link rel="stylesheet" href="{css_path}">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "description": "{meta}",
  "image": "https://ensignksa.com/assets/blog/{slug}-featured.png",
  "datePublished": "{pub_date}",
  "dateModified": "{pub_date}",
  "author": {{"@type": "Organization", "name": "Ensign AI Marketing Agency", "url": "https://ensignksa.com"}},
  "publisher": {{"@type": "Organization", "name": "Ensign AI Marketing Agency", "logo": {{"@type": "ImageObject", "url": "https://ensignksa.com/assets/logos/logo-main.png"}}}},
  "mainEntityOfPage": {{"@type": "WebPage", "@id": "{canonical}"}}
}}
</script>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TTFT7PF7" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<nav class="site-nav">
  <div class="nav-inner">
    <a href="{home_href}" class="nav-logo">
      <img src="{logo_src}" alt="Ensign AI Marketing Agency" class="nav-logo-img">
    </a>
    <div class="nav-links">
      {lang_switch}
      <a href="https://cal.com/ensign-ai-agency-q4mmzg/30min" target="_blank" rel="noopener noreferrer" class="nav-cta" data-event-name="book_call_click" data-cta-location="nav">{cta_nav}</a>
    </div>
  </div>
</nav>

<section class="blog-post-hero">
  <div class="container">
    <div class="blog-post-tags" data-animate="fade-up">
      <span class="blog-tag">{tag_cat}</span>
      <span class="blog-tag blog-tag--date">{tag_date}</span>
      <span class="blog-tag">{tag_read}</span>
    </div>
    <h1 class="blog-post-title" data-animate="fade-up" data-delay="0.1">{h1}</h1>
  </div>
</section>

<div class="container">
  <div class="blog-post-image" data-animate="fade-up" data-delay="0.1">
    <picture>
      <img src="{img_src}" alt="{img_alt}" width="1200" height="675" loading="eager">
    </picture>
  </div>
</div>

<section class="section" style="padding-top: 40px;">
  <div class="container">
    <article class="blog-post-content" data-animate="fade-up" data-delay="0.2">

{article_body}

    </article>
  </div>
</section>

<section class="section blog-post-cta">
  <div class="container">
    <div class="blog-cta-inner" data-animate="fade-up">
      <p class="blog-cta-label">{cta_label}</p>
      <h2 class="blog-cta-title">{cta_title}</h2>
      <p class="blog-cta-sub">{cta_sub}</p>
      <a href="https://cal.com/ensign-ai-agency-q4mmzg/30min" target="_blank" rel="noopener noreferrer" class="blog-cta-btn" data-event-name="book_call_click" data-cta-location="footer">{cta_btn} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </div>
  </div>
</section>

<!-- CTA Section (MANDATORY — see CLAUDE.md) -->
<section class="section" id="contact">
  <div class="container">
    <div class="cta-card" data-animate="fade-up">
      <div class="cta-pattern"></div>
      <h2 class="cta-title">{cta_card_title}</h2>
      <p class="cta-subtitle">{cta_card_sub}</p>
      <div class="cta-buttons">
        <a href="{book_path}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large" data-event-name="book_call_click" data-cta-location="body">
          <span>{cta_btn_book}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="mailto:contact@ensignksa.com" class="btn btn-outline btn-large">
          <span>{cta_btn_proposal}</span>
        </a>
        <a href="https://wa.me/966554409891" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-large" data-event-name="whatsapp_click" data-cta-location="body">
          <span>{cta_btn_whatsapp}</span>
        </a>
      </div>
    </div>
  </div>
</section>

<footer class="site-footer" {footer_dir}>
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="{home_href}">
          <img src="{logo_src}" alt="Ensign AI Marketing Agency" class="footer-logo">
        </a>
        <p class="footer-tagline">{footer_tagline}</p>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <p class="footer-col-title">{svc_lbl}</p>
          <a href="{ai_l}">{ai_t}</a>
          <a href="{ag_l}">{ag_t}</a>
          <a href="{os_l}">Ensign OS</a>
          <a href="{v_l}">{"رؤية 2030" if lang == "ar" else "Vision 2030"}</a>
        </div>
        <div class="footer-col">
          <p class="footer-col-title">{co_lbl}</p>
          <a href="{ab_l}">{ab_t}</a>
          <a href="{wk_l}">{wk_t}</a>
          <a href="{ca_l}">{ca_t}</a>
          <a href="{bl_l}">{bl_t}</a>
        </div>
        <div class="footer-col">
          <p class="footer-col-title">{conn_lbl}</p>
          <a href="https://www.linkedin.com/company/ensignksa" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/ensignksa" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://x.com/ensignksa" target="_blank" rel="noopener noreferrer">X</a>
          <a href="mailto:contact@ensignksa.com">{email_t}</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>{footer_copy}</p>
      <div class="footer-legal">
        <a href="/privacy-policy.html">{priv_t}</a>
        <a href="/terms-and-conditions.html">{terms_t}</a>
      </div>
    </div>
  </div>
</footer>

<script src="{js_path}" defer></script>
</body>
</html>"""

print("\nBuilding EN HTML...", flush=True)
en_html = build_html('en', EN_TITLE, EN_META, EN_H1, EN_ARTICLE, PUB_DATE, SLUG)
with open(EN_OUT, 'w', encoding='utf-8') as f:
    f.write(en_html)
print(f"  Written: {EN_OUT}", flush=True)

print("Building AR HTML...", flush=True)
ar_html = build_html('ar', AR_TITLE, AR_META, AR_H1, AR_ARTICLE, PUB_DATE, SLUG)
with open(AR_OUT, 'w', encoding='utf-8') as f:
    f.write(ar_html)
print(f"  Written: {AR_OUT}", flush=True)

# ─── Word Docs ─────────────────────────────────────────────────────────────
def set_rtl(para):
    pPr = para._p.get_or_add_pPr()
    bidi = OxmlElement('w:bidi')
    bidi.set(qn('w:val'), '1')
    pPr.insert(0, bidi)

def build_docx(title, sections, faq, lang='en', out_path=None):
    doc = Document()
    h = doc.add_heading(title, level=0)
    if lang == 'ar':
        h.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        set_rtl(h)
    doc.add_paragraph('')
    for typ, content in sections:
        clean_content = re.sub(r'<[^>]+>', '', content)  # strip HTML tags
        if typ == 'h2':
            p = doc.add_heading(clean_content, level=2)
        elif typ == 'h3':
            p = doc.add_heading(clean_content, level=3)
        elif typ == 'strong_p':
            p = doc.add_paragraph()
            m = re.match(r'^([^.:]+[.:])', clean_content)
            if m:
                p.add_run(m.group(1)).bold = True
                p.add_run(clean_content[len(m.group(1)):])
            else:
                p.add_run(clean_content).bold = True
        else:
            p = doc.add_paragraph(clean_content)
        if lang == 'ar' and hasattr(p, '_p'):
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            set_rtl(p)
    doc.add_heading('FAQ' if lang == 'en' else 'أسئلة شائعة', level=2)
    for q, a in faq:
        qp = doc.add_paragraph()
        qp.add_run(q).bold = True
        if lang == 'ar':
            qp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            set_rtl(qp)
        ap = doc.add_paragraph(a)
        if lang == 'ar':
            ap.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            set_rtl(ap)
        doc.add_paragraph('')
    if out_path:
        doc.save(out_path)
        print(f"  Saved: {out_path}", flush=True)

en_docx = os.path.join(ARCHIVE_DIR, "Email Marketing Automation for Saudi Businesses — EN.docx")
ar_docx = os.path.join(ARCHIVE_DIR, "Email Marketing Automation for Saudi Businesses — AR.docx")

print("\nBuilding Word docs...", flush=True)
build_docx(EN_TITLE, EN_SECTIONS, EN_FAQ, lang='en', out_path=en_docx)
build_docx(AR_TITLE, AR_SECTIONS, AR_FAQ, lang='ar', out_path=ar_docx)

# Copy featured image to archive
import shutil
img_src = r"C:\Users\Lenovo\Documents\Ensign-Website\assets\blog\email-marketing-automation-saudi-businesses-featured.png"
img_dst = os.path.join(ARCHIVE_DIR, "featured.png")
if os.path.exists(img_src):
    shutil.copy2(img_src, img_dst)
    print(f"  Copied featured image to archive.", flush=True)

print("\n=== DONE ===", flush=True)
print(f"EN HTML:  {EN_OUT}", flush=True)
print(f"AR HTML:  {AR_OUT}", flush=True)
print(f"EN docx:  {en_docx}", flush=True)
print(f"AR docx:  {ar_docx}", flush=True)
