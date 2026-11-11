# NAVA CREATIONS — Design Tokens & Asset Exports Directory
## Developer & Designer Integration Reference

> **Directory Status:** Proposed Design Tokens — Strictly Pending Business Owner Approval  
> **Brand:** NAVA CREATIONS (Bengaluru, Karnataka)  
> **Governance Notice:** These tokens reflect the proposed design system calibrated for Concept A (Deep Plum #5C1D38). They remain provisional and must NOT be deployed into production until the business owner completes the Phase 1.6 Approval Gate sign-off.  
> **Version:** 1.0.0 (Proposed / Pre-Approval)

---

### Contents of this Directory:

1. **`tokens.json`**: Proposed design-token format containing color definitions, font families, modular type scale, spacing units, border radii, and drop shadows. Subject to final concept ratification (Concept A vs Concept B) by the business owner.
2. **`tokens.css`**: Proposed CSS Custom Properties (`:root` definitions) incorporating responsive font-size reductions for mobile viewports and WCAG 2.2 AA accessible contrast enforcement. Pending business owner approval.

### Proposed Architecture for Future Phase 2 Integration:
```css
/* In global.css (Future Phase 2 — Pending Owner Approval) */
@import "./tokens.css";

/* Extend theme in tailwind config or utility classes */
.btn-primary {
  background-color: var(--color-primary-plum);
  color: var(--color-text-inverse);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.btn-primary:hover {
  background-color: var(--color-primary-plum-hover);
}
```

---

*Maintained by Digital Product Design-System Specialist. Status: Proposed & Awaiting Owner Gate Approval.*
