---
name: depthwizard
description: Project-specific operating rules for building DepthWizard. Use this skill for product truth, geospatial and ML constraints, documentation authority, architecture boundaries, and delegation to the installed better-* UI skills.
---

# DepthWizard

## Purpose

DepthWizard is a technical geospatial application for turning single-view optical imagery into elevation information, terrain visualization, terrain analysis, validation, and analyst-ready exports.

It is a **terrain understanding tool**, not an AI demo and not a generic AI SaaS product.

Core pipeline:

```text
Single Image → Elevation Estimate → Terrain Reconstruction
→ Terrain Intelligence → Validation → Analyst-ready Output
```

The model is one component of this larger pipeline.

## Documentation

Use `docs/README.md` as the documentation map. Do not read every document for every task.

Route tasks as follows:

- Product scope: `docs/product/capabilities.md`, `docs/product/user-flows.md`
- Terrain result/data: `docs/product/output-contract.md`
- Workspace UI: `docs/design/design-system.md`, `docs/design/interaction-rules.md`, `docs/design/workspace-wireframe-spec.md`
- Frontend: `docs/architecture/frontend.md`
- Backend/API: `docs/architecture/backend.md`, `docs/engineering/api-contract.md`, `docs/product/output-contract.md`
- ML: `docs/ml/ml-pipeline.md`, `docs/ml/data-and-validation.md`, `docs/architecture/ml-integration.md`
- Deployment/testing: `docs/engineering/deployment.md`, `docs/engineering/requirements.md`, `docs/engineering/testing.md`
- Decisions: `docs/decisions/decision-log.md`

If a referenced document does not exist, do not invent its contents. Use the available sources and state the gap when it materially affects the task.

## Documentation authority

When project documents conflict:

```text
Decision Log
    ↓
Product / Engineering Truth
    ↓
ML / Validation Truth
    ↓
Design Truth
    ↓
Implementation Plan
```

Do not silently resolve meaningful contradictions.

If the implementation plan conflicts with a locked decision, the decision wins. If UI ideas conflict with product capabilities or backend contracts, the contracts win.

## Geospatial truth

These rules are non-negotiable.

### Relative vs absolute elevation

Non-georeferenced JPG/PNG imagery may produce relative elevation/height.

Never label relative values as metres, MSL, AMSL, absolute elevation, or metric height unless a legitimate calibration path supports that claim.

### GeoTIFF metadata

Preserve available:

- CRS
- affine transform
- bounds
- pixel resolution
- NoData
- datum / vertical reference where known

Never invent missing metadata or coordinates.

### Calibration

Calibration is modular. Do not assume that DEM, GCP, or another reference automatically produces accurate metric heights. Calibration methods require validation.

### Validation

Numerical validation must come from actual reference data or an explicitly defined validation method. Do not turn visual similarity into a numerical validation claim.

## ML truth

Depth Anything V2 is an implementation component, not the product identity.

Keep model-specific logic behind a stable inference boundary.

Treat current ML evidence according to its documented status:

- GAMUS is a current training base, not proof of satellite-domain generalization.
- Experimental metrics are not universal benchmark claims.
- Shadow geometry is a verification cue, not a replacement for learned estimation.
- Learned-vs-physical disagreement is a reliability signal, not automatically a calibrated probability.
- An unvalidated calibration experiment is not the final calibration method.

Never invent model confidence or accuracy.

## Backend is the analytical source of truth

The frontend must not independently invent:

- height values
- slope values
- validation metrics
- confidence values
- CRS information
- calibration state
- coordinates
- report statistics

Use the `TerrainResult` output contract and its `capabilities` state.

Features may depend on input format, georeferencing, calibration, reference data, processing success, generated assets, or validation availability.

Represent unavailable functionality honestly. Never fabricate a fallback value.

## Product-specific visual direction

DepthWizard should look like a serious geospatial instrument:

- technical
- precise
- restrained
- spatial
- trustworthy
- strong hierarchy
- purposeful color
- useful information density
- generous whitespace where appropriate

Avoid:

- purple/blue AI gradients
- glowing blobs
- decorative AI particles
- decorative 3D globes
- excessive glassmorphism
- excessive rounded cards
- meaningless animation
- marketing buzzword overload
- generic AI SaaS/dashboard aesthetics

The 3D terrain itself is functional product content. Decorative 3D unrelated to terrain is not.

## Delegate generic UI rules

Do not duplicate the installed UI skills' detailed rules here.

Use:

```text
Layout              → better-layout
UI polish           → better-ui
Typography          → better-typography
Color               → better-colors
Accessibility       → better-accessibility
Interface copy      → better-writing
Holistic UI review  → better-interface
Change review       → interface-review
Component stress    → break
Design alternatives → variant
Interface analysis  → explain-interface
```

DepthWizard-specific rules in this skill override generic defaults only where explicitly stated here. Otherwise follow the owning skill.

## Agent workflow

Before changing code:

1. Inspect the repository and current implementation.
2. Read the relevant project documentation.
3. Check the decision log when architecture/product decisions may be affected.
4. Identify the smallest coherent scope.
5. Preserve working behavior unless the task requires changing it.

During implementation:

1. Make the smallest coherent change.
2. Reuse existing components, tokens, utilities, and patterns.
3. Avoid unnecessary dependencies.
4. Keep frontend, backend, ML, and geospatial responsibilities separated.
5. Never invent backend data or capabilities.

After implementation:

1. Run relevant tests/checks.
2. Run the app when visual behavior matters.
3. Inspect affected UI states.
4. Use `better-interface` for holistic UI review when appropriate.
5. Use `break` for component stress testing when appropriate.
6. Use `interface-review` for change-focused interface review.
7. Mark anything not actually verified as `Not verified`.

Never claim something was tested, measured, validated, or visually inspected when it was not.

## UI state completeness

For relevant features, account for:

```text
EMPTY
LOADING
PROCESSING
READY
ACTIVE
UNAVAILABLE
ERROR
```

For tools:

```text
SELECTING
COMPLETE
CANCELLED
```

For report/export:

```text
GENERATING
SUCCESS
FAILED
```

Do not build only the happy path when failure or unavailable states are meaningful.

## Reporting

Reports contain actual computed information.

The default report includes all information available for the processed result. Custom reports may select available sections.

Unavailable sections should be clearly unavailable rather than fabricated or silently represented as valid data.

Analyst observations must be derived from actual computed data. Do not turn model output into unsupported operational, military, intelligence, or other consequential conclusions.

## Claims and status

Use explicit status labels where appropriate:

```text
DONE
IN PROGRESS
TARGET
FUTURE
EXPERIMENTAL
UNVALIDATED
```

Never upgrade `TARGET → DONE`, `EXPERIMENTAL → PROVEN`, or `UNVALIDATED → VALIDATED` without evidence.

Avoid unsupported claims such as first-ever, unprecedented, guaranteed accuracy, production-ready before testing, or universal satellite generalization from GAMUS alone.

## Architecture boundaries

Keep the pipeline modular:

```text
Input / Metadata
    ↓
Preprocessing
    ↓
ML Inference
    ↓
Verification
    ↓
Calibration
    ↓
Terrain Reconstruction
    ↓
Terrain Analysis
    ↓
Validation
    ↓
Visualization
    ↓
Export / Reporting
```

Do not tightly couple the viewer to the ML model.

Do not put geospatial calculations into UI components.

Do not make report generation independently recalculate values already provided by the backend result.

Do not make training code part of the deployed application.

## When requirements are unclear

Use this order:

```text
Explicit task request
    ↓
Decision log
    ↓
Product documentation
    ↓
Engineering contract
    ↓
Design documentation
    ↓
Existing implementation
    ↓
Reasonable implementation choice
```

Do not invent a product requirement for convenience. Surface meaningful ambiguity instead of silently making a product-level decision.

## Core principle

> DepthWizard is a tool for understanding terrain, not a webpage demonstrating AI.
