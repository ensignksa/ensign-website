# Ensign Website — Project Rules

## MANDATORY: Every blog post must end with the `cta-card` block

Every new blog post (EN and AR) MUST include the full `cta-card` CTA section directly above the `<footer class="site-footer">`. This is non-negotiable — the small `blog-cta` inline link is not a substitute.

**Why:** Conversion. Every post needs the three primary CTAs (Book a Discovery Call / Request a Proposal / WhatsApp Us) visible at the end. Two May 2026 posts shipped without it and had to be patched.

**How to apply:**
- Applies to: every new file in `blog/*.html` and `ar/blog/*.html`.
- Insert position: immediately before `<footer class="site-footer">`.
- The `cta-title` and `cta-subtitle` MUST be tailored to the post's topic — never reuse the same copy across posts.
- Update `blog/post-template.html` and `ar/blog/post-template.html` and any `build_blog_*.py` scripts so future generation includes the block by default.
- Reference implementation: [blog/crm-setup-saudi-businesses.html:552-573](blog/crm-setup-saudi-businesses.html:552) (EN) and [ar/blog/crm-setup-saudi-businesses.html:825-839](ar/blog/crm-setup-saudi-businesses.html:825) (AR).

### EN block (template)
```html
<!-- CTA Section -->
<section class="section" id="contact">
  <div class="container">
    <div class="cta-card" data-animate="fade-up">
      <div class="cta-pattern"></div>
      <h2 class="cta-title">[POST-SPECIFIC TITLE]</h2>
      <p class="cta-subtitle">[POST-SPECIFIC SUBTITLE — calm, exact, brand voice, no exclamation marks]</p>
      <div class="cta-buttons">
        <a href="/book.html" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-large" data-event-name="book_call_click" data-cta-location="body">
          <span>Book a Discovery Call</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <a href="mailto:contact@ensignksa.com" class="btn btn-outline btn-large">
          <span>Request a Proposal</span>
        </a>
        <a href="https://wa.me/966554409891" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-large" data-event-name="whatsapp_click" data-cta-location="body">
          <span>WhatsApp Us</span>
        </a>
      </div>
    </div>
  </div>
</section>
```

### AR block (template)
```html
<!-- CTA Section -->
<section class="section" id="contact">
<div class="container">
<div class="cta-card" data-animate="fade-up">
<div class="cta-pattern"></div>
<h2 class="cta-title">[عنوان مخصص للمقال]</h2>
<p class="cta-subtitle">[وصف مخصص — بصوت العلامة، هادئ ودقيق، بدون علامات تعجب]</p>
<div class="cta-buttons">
<a class="btn btn-primary btn-large" href="/ar/book.html" rel="noopener noreferrer" target="_blank" data-event-name="book_call_click" data-cta-location="body">احجز موعداً الآن</a>
<a class="btn btn-outline btn-large" href="mailto:contact@ensignksa.com">راسلنا لطلب عرض أسعار</a>
<a class="btn btn-whatsapp btn-large" href="https://wa.me/966554409891" rel="noopener noreferrer" target="_blank" data-event-name="whatsapp_click" data-cta-location="body">تواصل معنا عبر واتساب</a>
</div>
</div>
</div>
</section>
```
