# Intelligence lenses

Public-facing posture for each of the six intelligence lenses surfaced on
ensignksa.com. One file per `(lens, language)` pair plus a single `index.js`
that re-exports them.

## Layout

```
lenses/
  index.js            single entry — exports LENSES_EN, LENSES_AR, LENS_LABELS_EN, LENS_LABELS_AR
  sales.en.js         sales.ar.js
  marketing.en.js     marketing.ar.js
  workflow.en.js      workflow.ar.js
  reporting.en.js     reporting.ar.js
  content.en.js       content.ar.js
  agents.en.js        agents.ar.js
README.md             this file
```

`system.en.js` and `system.ar.js` import from `./lenses/index.js` so the
public chat lives entirely on these files plus `../brand-voice.js`.

## Source of truth

These lenses are public-safe distillations of the internal agent briefs that
live in the private `ensign-ai-marketing-agency/agents/*.md` ecosystem. The
internal files are **the source of truth**. These lens files mirror their
analytical posture, never their internal names, file paths, tech stack, or
collaboration order.

The mapping (internal only, never exposed in chat):

| Public lens | Internal agent(s) distilled from |
|---|---|
| sales       | sales + ceo (positioning) |
| marketing   | marketing + research |
| workflow    | operations |
| reporting   | growth + operations (cadence) |
| content     | content_creator + designer |
| agents      | engineer + growth_marketing_automation |

## What goes into a lens file

Each file exports a single object:

```js
export const SALES_EN = {
  label: "AI Sales Intelligence",  // user-visible
  posture: `...`,                  // injected into the system prompt
};
```

The `posture` string contains, in this order:

1. **What you notice before they do.** The analytical patterns the agent
   already sees. This is what makes the response feel embedded.
2. **Inspection context that lets you produce.** The minimum signals the
   agent needs to skip discovery and start producing.
3. **Mini deliverable shape.** What the agent actually emits when forced
   to produce (turn 2 onwards). Executive prose only, never a labeled
   report.
4. **What stops being human, what stays human.** The closing rhythm for
   Turn 3.
5. **Anti-patterns.** Specific phrasings and moves to avoid.

## What never appears in a lens file

- The agency's internal name ("Ensign AI Marketing Agency" / "Ensign Labs").
- The internal nine-role framing or "AI Operating System" branding.
- Internal agent names ("CEO Agent", "Engineer Agent", etc).
- Source-tree paths, env var names, or tech stack (FastAPI, Supabase, etc).
- Client names or playbook content.

## When to update

If the internal agent brief changes in a way that shifts what the public
agent should look at or produce, update the corresponding lens file by
hand. There is no auto-generator — hand-written keeps editorial control
over what goes public.

Run a smoke test after any edit:

```bash
node -e "import('./api/intelligence/_lib/prompts/system.en.js').then(m=>console.log(m.systemEN({name:'X',company:'Y',industry:'Z',website:'',turnIndex:2,totalTurns:3,selectedIntelligence:'<lens>',forceProduce:true}).length))"
```
