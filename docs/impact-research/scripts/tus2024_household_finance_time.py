#!/usr/bin/env python3
"""
Time spent on household financial management in India, from the MoSPI Time Use
Survey (TUS) 2024 unit-level person file.

Why this script exists
----------------------
The published TUS 2024 report and press note only tabulate broad ICATUS 2016
divisions (e.g. "unpaid domestic services for household members"). Household
financial management is two 3-digit codes inside that division:

    351  Paying household bills
    352  Budgeting, planning, organizing duties and activities in the household

Those codes are only available in the unit-level data, so any figure the website
shows for "time Indians spend managing household finances" has to be computed
here. The script is standard-library Python so anyone can re-run it.

Method (follows MoSPI's own definitions in README_TUS_2024.pdf, page 3)
----------------------------------------------------------------------
* Unit of analysis: persons aged 6+, the population TUS covers.
* A 24-hour reference day (04:00 to 04:00) split into 30-minute slots; up to three
  activities are recorded per slot, and consecutive identical slots are clubbed.
* Time allocation, two variants MoSPI describes:
    A. "major activity"  - the whole slot goes to the activity flagged major.
    B. "all activities"  - the slot is split equally among its activities.
  Both are reported. The published tables are reproduced first (see VALIDATION)
  to establish which variant MoSPI uses, and that variant is the headline.
* Average time per person = weighted total minutes / weighted persons
  (participants and non-participants alike), per MoSPI definition (c).
* Weights: MULT is recorded with two implied decimal places, so weight = MULT/100.
  Ratios (minutes per person, participation) do not depend on the weight scale;
  only the estimated population does.

VALIDATION
----------
Before trusting the finance codes, the script recomputes figures that MoSPI
published in the TUS 2024 press note (28 March 2025, Tables 1 and 2) for ICATUS
division 3 (unpaid domestic services), ages 15-59. If the recomputed values do
not match the published ones, the finance figures should not be used.

Usage
-----
    python3 tus2024_household_finance_time.py /path/to/TUS106PER.csv \
        ../derived/tus2024-household-finance-time.json
"""

import csv
import hashlib
import json
import sys
from collections import defaultdict
from datetime import date

# Column positions in TUS106PER.csv (header names repeat, so index, not name).
C_FSU, C_HHLD, C_PERSON = 1, 11, 12
C_SECTOR, C_GENDER, C_AGE = 4, 14, 15
C_DAY_TYPE = 25
C_FROM, C_TO = 30, 31
C_MAJOR, C_CODE = 34, 35
C_MULT = 40

FINANCE_CODES = {"351", "352"}


def minutes_since_4am(hhmm):
    h, m = hhmm.strip().split(":")
    return (int(h) * 60 + int(m) - 240) % 1440


def slot_minutes(t_from, t_to):
    start, end = minutes_since_4am(t_from), minutes_since_4am(t_to)
    if end <= start:
        end += 1440
    return end - start


def groups_for(sector, gender, age):
    """Every reporting group this person belongs to."""
    out = ["all_6plus"]
    if age >= 15:
        out.append("age_15plus")
    if 15 <= age <= 24:
        out.append("age_15_24")
    if age >= 25:
        out.append("age_25plus")
    if 15 <= age <= 29:
        out.append("age_15_29")
    if 15 <= age <= 59:
        out.append("age_15_59")
        out.append({"1": "male_15_59", "2": "female_15_59"}.get(gender, "other_15_59"))
    out.append({"1": "rural", "2": "urban"}.get(sector, "sector_unknown"))
    out.append({"1": "male", "2": "female"}.get(gender, "gender_other"))
    return out


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 22), b""):
            h.update(chunk)
    return h.hexdigest()


def main(csv_path, out_path):
    # Per-group weighted accumulators.
    acc = defaultdict(lambda: defaultdict(float))
    persons_seen = set()
    rows_read = 0
    unsorted_hits = 0

    def flush(key, meta, activities):
        if key is None:
            return
        sector, gender, age, weight = meta
        by_slot = defaultdict(list)
        for t_from, t_to, code, major in activities:
            by_slot[(t_from, t_to)].append((code, major))

        mins = defaultdict(lambda: {"A": 0.0, "B": 0.0})
        for (t_from, t_to), acts in by_slot.items():
            dur = slot_minutes(t_from, t_to)
            share = dur / len(acts)
            for code, major in acts:
                buckets = []
                if code.startswith("3"):
                    buckets.append("div3_domestic")
                if code in FINANCE_CODES:
                    buckets.append("finance_351_352")
                if code == "351":
                    buckets.append("code_351")
                if code == "352":
                    buckets.append("code_352")
                if code == "359":
                    buckets.append("code_359")
                for b in buckets:
                    mins[b]["B"] += share
                    if major == "1":
                        mins[b]["A"] += dur

        for g in groups_for(sector, gender, age):
            a = acc[g]
            a["persons_w"] += weight
            a["persons_n"] += 1
            for b, m in mins.items():
                for method in ("A", "B"):
                    a[f"{b}_minutes_{method}_w"] += weight * m[method]
                    if m[method] > 0:
                        a[f"{b}_participants_{method}_w"] += weight

    # Household members with no diary (under 6, or not interviewed) appear as one
    # row with every activity field blank. They are outside the TUS population,
    # so they are skipped and counted rather than treated as zero-minute people.
    no_diary_rows = 0

    current_key, current_meta, activities = None, None, []
    with open(csv_path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        next(reader)  # header
        for row in reader:
            rows_read += 1
            if not row[C_FROM].strip() or not row[C_TO].strip() or not row[C_CODE].strip():
                no_diary_rows += 1
                continue
            key = (row[C_FSU], row[C_HHLD], row[C_PERSON])
            if key != current_key:
                flush(current_key, current_meta, activities)
                if key in persons_seen:
                    unsorted_hits += 1
                persons_seen.add(key)
                age = int(row[C_AGE]) if row[C_AGE].strip().isdigit() else -1
                current_key = key
                current_meta = (row[C_SECTOR].strip(), row[C_GENDER].strip(), age,
                                int(row[C_MULT]) / 100.0)
                activities = []
            activities.append((row[C_FROM], row[C_TO], row[C_CODE].strip(), row[C_MAJOR].strip()))
        flush(current_key, current_meta, activities)

    results = {}
    for g, a in sorted(acc.items()):
        pw = a["persons_w"]
        entry = {"persons_sampled": int(a["persons_n"]), "persons_weighted": round(pw)}
        for b in ("div3_domestic", "finance_351_352", "code_351", "code_352", "code_359"):
            for method in ("A", "B"):
                total = a.get(f"{b}_minutes_{method}_w", 0.0)
                part = a.get(f"{b}_participants_{method}_w", 0.0)
                entry[f"{b}_{method}"] = {
                    "minutes_per_person_per_day": round(total / pw, 3) if pw else None,
                    "participation_rate_pct": round(100 * part / pw, 2) if pw else None,
                    "minutes_per_participant_per_day": round(total / part, 1) if part else None,
                }
        results[g] = entry

    output = {
        "source": "MoSPI Time Use Survey 2024, unit-level person file TUS106PER",
        "input_file": csv_path.split("/")[-1],
        "input_sha256": sha256(csv_path),
        "rows_read": rows_read,
        "rows_without_diary_skipped": no_diary_rows,
        "persons": len(persons_seen),
        "person_key_reappeared_non_contiguously": unsorted_hits,
        "method_notes": {
            "A": "whole slot allotted to the major activity (README p.3, method a)",
            "B": "slot split equally among all activities in it (README p.3, method b)",
            "weight": "MULT/100",
            "reference_day": "04:00 to 04:00, persons aged 6+",
        },
        # ICATUS division 3 (unpaid domestic services for household members),
        # all-India, from the TUS 2024 press note of 28 March 2025.
        "published_benchmarks_press_note_2025_03_28": {
            "table1_participation_pct_age_15_59": {"male": 30.4, "female": 92.9, "person": 61.7},
            "table2_minutes_per_participant_age_15_59": {"male": 86, "female": 305, "person": 251},
            "table3_minutes_per_person_age_15_59": {"male": 26, "female": 283, "person": 155},
        },
        "computed_on": date.today().isoformat(),
        "results": results,
    }
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(json.dumps({k: output[k] for k in ("rows_read", "persons", "person_key_reappeared_non_contiguously")}))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
