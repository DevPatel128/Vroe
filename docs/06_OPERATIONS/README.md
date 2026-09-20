# 06 Operations

**Status:** Review · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

- **Purpose:** when something breaks, or needs doing, a person knows exactly where
  to go.
- **Belongs here:** observability, incidents, runbooks, backups, disaster recovery
  and rollbacks.
- **Does not belong here:** how the system is designed
  ([05_ENGINEERING](../05_ENGINEERING/README.md)).
- **Important files:** [OBSERVABILITY.md](OBSERVABILITY.md),
  [INCIDENTS.md](INCIDENTS.md), [ROLLBACKS.md](ROLLBACKS.md),
  [BACKUPS.md](BACKUPS.md), [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md),
  [RUNBOOKS/](RUNBOOKS/README.md).
- **Source of truth:** one procedure, one place. A runbook links to the engineering
  document that explains *why*; it does not repeat it.

| Something broke | Go here |
| --- | --- |
| A deploy went red or the live site is wrong | [RUNBOOKS/DEPLOY.md](RUNBOOKS/DEPLOY.md), then [ROLLBACKS.md](ROLLBACKS.md) |
| A secret or subscriber data may be exposed | [INCIDENTS.md](INCIDENTS.md) |
| I am not sure it is up | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Someone asked to be removed from the list | [RUNBOOKS/SUBSCRIBER-LIST.md](RUNBOOKS/SUBSCRIBER-LIST.md) |
| The list, or the account, is lost | [BACKUPS.md](BACKUPS.md), [DISASTER-RECOVERY.md](DISASTER-RECOVERY.md) |
