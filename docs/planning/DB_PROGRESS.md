# EvalPro — DB Implementation Progress

## Summary
- **Done:** 20 / 42
- **Pending:** 22 / 42

---

## ✅ Done (20)

### Users & Roles
| Table | Notes |
|---|---|
| `organizations` | |
| `users` | No `role` column — roles live in `user_roles`. Has `full_name`. |
| `user_roles` | Junction table. PK (user_id, role). Enum USER_ROLE: PROFESSIONAL \| PATIENT \| ADMIN \| SUPERADMIN |
| `professionals` | Enum SPECIALTY: KINESIOLOGY \| NUTRITION. UNIQUE (user_id, specialty) |
| `patients` | Minimal — just patient_id + user_id |

### Core
| Table | Notes |
|---|---|
| `domains` | Seeded: KINESIOLOGY, NUTRITION, PSYCHOLOGY, TRAINING |
| `regions` | Seeded: CERVICAL, SHOULDER, ELBOW, WRIST, LUMBAR, HIP, KNEE, ANKLE |
| `objectives` | Seeded: REHABILITATION, SPORTS_PERFORMANCE, AESTHETIC, GENERAL_HEALTH, WEIGHT_LOSS |
| `sessions` | Renamed from `evaluations`. Contacto clínico profesional-paciente. |
| `session_derivations` | Relación entre sesiones cuando el scoring activa otro dominio. |

### Anamnesis
| Table | Notes |
|---|---|
| `anamnesis_phase1_questions` | Seeded with 4 questions |
| `anamnesis_phase2_questions` | Dynamic — `active_if` (STRUCTURE_TYPE enum) + optional `domain_id` |
| `anamnesis_answers` | Covers both phases. UNIQUE (evaluation_id, question_id) |
| `anamnesis_structure_profiles` | System-inferred. Enum STRUCTURE_TYPE: TENDON \| MUSCLE \| LIGAMENT \| BONE |

---

## 🔲 Pending (22)

### Tests & Findings
| Table | Notes |
|---|---|
| `tests` | |
| `test_results` | |
| `signs_symptoms` | |
| `evaluation_signs` | |

### Complementary Studies
| Table | Notes |
|---|---|
| `complementary_studies` | |
| `study_results` | States: REQUESTED \| PENDING \| LOADED \| EXPIRED |
| `study_suggestions` | |

### Diagnoses & Interventions
| Table | Notes |
|---|---|
| `diagnoses` | |
| `interventions` | |
| `diagnosis_interventions` | |

### Scoring Engine
| Table | Notes |
|---|---|
| `scoring_rules` | Unified table: source (phase1/phase2/test/study) → diagnosis → weight |
| `test_evidence` | Sensitivity + specificity per test/diagnosis (Bayesian Layer 2) |
| `prevalence` | Pre-test probability per diagnosis and context |
| `clusters` | Test combinations with specificity bonus |
| `suggested_diagnoses` | Scoring output per evaluation with % and phase breakdown |

### Regional System
| Table | Notes |
|---|---|
| `pathology_regions` | Origin + referred regions per diagnosis |
| `regional_chains` | Biomechanical/neurological connections between regions |
| `regional_referrals` | Rules: suggest new region when local score is low |

### Safety
| Table | Notes |
|---|---|
| `red_flags` | Alarm findings with action and priority per domain |

### Evolution & Referral
| Table | Notes |
|---|---|
| `evaluation_evolutions` | Session-to-session progress tracking |
| `interdomain_referral_rules` | When to suggest another domain based on evolution or findings |
| `objective_domains` | Required/recommended domains per patient objective |

### Scheduling
| Table | Notes |
|---|---|
| `locations` | Spaces where sessions happen. Enum LOCATION_TYPE: GYM \| REHAB_CENTER \| CLINIC |
| `location_operating_hours` | Weekly opening hours per location. day_of_week 0=Sunday |
| `weekly_availability` | Recurring professional availability. `location_id` nullable |
| `availability_overrides` | Date-range exceptions. Enum OVERRIDE_TYPE: BLOCKED \| EXTRA |
| `appointments` | Booked slot. `professional_id` or `location_id` required (or both). `max_capacity` nullable |
| `appointment_sessions` | Junction: one appointment can have multiple sessions (group classes) |
