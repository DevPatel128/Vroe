# Impact research

**Status:** Approved · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The raw material behind the evidence layer on `/trove`, kept together so the
figures can be checked and compared. The method and the rules live in
[RESEARCH.md](../RESEARCH.md); every source, with its URL and checksum, is indexed
in [SOURCES.md](../SOURCES.md).

```
impact-research/
  raw/        source files as downloaded — gitignored for size (≈ 125 MB)
  scripts/    reproducible computations over the raw files
  derived/    committed outputs of those scripts
```

`raw/` is not in git: it is gitignored for size (about 125 MB), and
[SOURCES.md](../SOURCES.md) lists each file's origin and SHA-256 so it can be
re-downloaded and verified.

## Reproducing the India time figure

The TUS 2024 person file unzips to `TUS106PER.csv` (1,324,315,633 bytes,
SHA-256 `32106d7f9c4ef8893481f35b67fea5e229b2929f4763047c4306c1de8f8763a6`).

```bash
unzip raw/india/MoSPI-TUS-2024-Person-Level-Data-CSV.zip -d /tmp/tus2024
python3 scripts/tus2024_household_finance_time.py /tmp/tus2024/TUS106PER.csv derived/tus2024-household-finance-time.json
```

Standard-library Python, about 35 seconds. Output in
`derived/tus2024-household-finance-time.json`.

**Validation.** Splitting a half-hour slot equally between its activities
(MoSPI's method b) reproduces the published press-note figures for unpaid
domestic services, ages 15–59:

| | Published | Computed |
| --- | --- | --- |
| Participation, men / women / all | 30.4 / 92.9 / 61.7% | 30.36 / 92.86 / 61.69% |
| Minutes per participant, men / women / all | 86 / 305 / 251 | 86.2 / 305.1 / 251.3 |
| Minutes per person, men / women / all | 26 / 283 / 155 | 26.2 / 283.3 / 155.1 |

Allotting the whole slot to the "major" activity (method a) does not reproduce
them, so method b is the one used.

**What the file does not give.** The weights (`MULT/100`) sum to about 983
million people aged 6+, well below India's population. MoSPI's note to data
users says the unit-level data should not be used to estimate population, so the
website multiplies the per-adult average by the World Bank's adult population
instead. The script also reads 450,457 people with a diary, against 454,192
enumerated in the press note; 83,262 household-member rows with no diary are
skipped.
