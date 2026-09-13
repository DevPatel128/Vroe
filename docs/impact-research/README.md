# Impact research

The source documents behind the evidence layer on `/trove`, kept together so the
figures can be checked and compared. The method and the rules live in
[../10-evidence.md](../10-evidence.md); this folder is the raw material.

```
impact-research/
  raw/        source files as downloaded — gitignored for size (≈ 125 MB)
  scripts/    reproducible computations over the raw files
  derived/    committed outputs of those scripts
```

`raw/` is not in git. Every file is listed below with the URL it came from and
its SHA-256, so anyone can download the same bytes and confirm they match:

```bash
shasum -a 256 raw/india/MoSPI-TUS-2024-Person-Level-Data-CSV.zip
```

All files were retrieved on 13 September 2026.

**Recency rule.** The website only uses data collected and published in 2024 or
later. Older files stay here as research records, marked "not used", so the
reasoning behind leaving them out can be checked.

## Global

| File | Source | Bytes | SHA-256 | Used for |
| --- | --- | --- | --- | --- |
| `raw/global/WorldBank-Global-Findex-Database-2025.csv` | [World Bank](https://thedocs.worldbank.org/en/doc/be6615202d1f08a25855c8ac2d615122-0050012025/related/GlobalFindexDatabase2025.csv) (last modified 22 Jun 2026) | 17,643,094 | `dce89f60a9aceaf60a7be62b56b6a52e4d47405ee48fe2e2227da60f2a9d51cd` | 2024 wave only: India fragility and worry about bills; adult populations for India and the US. The 2021 wave in the same file is not used |
| `raw/global/SP-Global-FinLit-Survey-2014-Financial-Literacy-Around-the-World.pdf` | [GFLEC](https://gflec.org/wp-content/uploads/2015/11/3313-Finlit_Report_FINAL-5.11.16.pdf) | 3,548,163 | `2904230d48a92808b2fd6733237295d9ef79083812d9b7c397b7f8c9873f5cc5` | **Not used** — collected 2014 |
| `raw/global/OECD-INFE-2023-International-Survey-of-Adult-Financial-Literacy.pdf` | [OECD](https://www.oecd.org/content/dam/oecd/en/publications/reports/2023/12/oecd-infe-2023-international-survey-of-adult-financial-literacy_8ce94e2c/56003a32-en.pdf) | 2,664,403 | `5e87da5a7164f7bc85b4a76c28a4332135f5a36c1dc73a213157aca0efeb501e` | **Not used** — collected 2022–23, and covers only 2 of the 10 countries |

## India

| File | Source | Bytes | SHA-256 | Used for |
| --- | --- | --- | --- | --- |
| `raw/india/MoSPI-TUS-2024-Person-Level-Data-CSV.zip` | [OpenCity mirror](https://data.opencity.in/dataset/national-time-use-survey-2024) of the [MoSPI release](https://microdata.gov.in/NADA/index.php/catalog/236) | 76,496,743 | `54d40039a2014e8498c3b12c80efe456b35a59d5548b910bc54b2e552ce02ceb` | Time on household finances |
| `raw/india/MoSPI-TUS-2024-Data-Layout.xlsx` | same dataset | 21,616 | `5f18e4f62e9ca19b859f8ed8126b99404b2e6a49644c2435856766f915c79af5` | Column meanings |
| `raw/india/MoSPI-TUS-2024-Instructions-Vol1.pdf` | same dataset | 4,840,660 | `81bccd607329bdd42c6f0c9efbb98bc9950928886dcd5fbf23a92241b97ef4c0` | ICATUS codes 351, 352; diary rules |
| `raw/india/MoSPI-TUS-2024-Readme.pdf` | same dataset | 57,341 | `e0460b4a7bda51f45e9e012cc42f3b07991e493c496e1c4b9d3b38db352f65ed` | Weights, indicator definitions |
| `raw/india/MoSPI-TUS-2024-Note-to-Data-Users.pdf` | same dataset | 17,477 | `c343b78d3f4aa99dd81a15c949720984cbbe4eb8658f73e3b1748d623ea845b4` | Why survey weights are not a population estimate |
| `raw/india/MoSPI-TUS-2024-Sample-Design-and-Estimation.pdf` | same dataset | 320,455 | `1564f3b306df65e4552d14793b2bf28629d6a91eb131acbcd734a8af18d4efdc` | Sample design |
| `raw/india/MoSPI-TUS-2024-Press-Note-2025-03-28.pdf` | [MoSPI](https://www.mospi.gov.in/sites/default/files/press_release/Press_Note_28.03.2025-1.pdf) | 420,802 | `1a0334ece35dc7c5a0421e34c03af40f2c5ffafe3924a3c8a77a8fdb85fbdd66` | Published benchmarks the script must reproduce |
| `raw/india/SEBI-Investor-Survey-2025-Main-Report.pdf` | [SEBI](https://www.sebi.gov.in/sebi_data/commondocs/jan-2026/Investor%20Survey%202025%20Main%20Report.pdf) | 4,395,061 | `1d9d45a9641ca008e609913a8837902ab6bdef1c2609c6eba6a4fb1ca0d95519` | Knowledge, barriers, awareness, participation, finfluencers (fieldwork May–July 2025) |
| `raw/india/AMFI-Monthly-Note-August-2026.pdf` | [AMFI](https://portal.amfiindia.com/spages/amaug2026repo.pdf) | 350,274 | `57d900c61e47d3d644e9188843e4586f4c275152cc9b1364a87032c6915b17cf` | Mutual fund folios |
| `raw/india/NCFE-FLIS-2019-Final-Report.pdf` | [NCFE](https://ncfe.org.in/wp-content/uploads/2023/12/NCFE-2019_Final_Report.pdf) | 7,038,991 | `c2ec34279ca3c805a8cdeb965b0723c0f855114cefb55005f26c297781caacbf` | **Not used** — collected 2018–19. NCFE's 2025 survey had not published results when checked |
| `raw/india/MoSPI-Time-Use-Survey-2019-Report.pdf` | [MoSPI](https://www.mospi.gov.in/sites/default/files/publication_reports/Report%20of%20the%20Time%20Use%20Survey-Final.pdf) | 6,296,134 | `706dbd3f987eac7e64c6ef5cc7873c433bba661b2b8e9674e188691fe9fd03f4` | **Not used** — only checked that published reports do not tabulate finance codes |

## United States

No file: the ATUS figure was read from the BLS Public Data API
(`https://api.bls.gov/publicAPI/v2/timeseries/data/TUU10101AA01048669`), which
returned 0.03 hours a day for 2025.

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

## Looked at and not used

- **Anything collected before 2024** — S&P Global FinLit 2014, the Findex 2021
  wave (which ranked all ten countries on financial fragility), NCFE-FLIS 2019
  and OECD/INFE 2023. With them went the only burden measures verified for the
  UK, Canada, Australia, Singapore, Germany, France, Japan and the UAE, so those
  countries are not on the page.
- **Findex 2024 fragility and worry questions for high-income countries.** The
  questions were asked worldwide, but the 2025 database publishes them as `NA`
  (or `0` placeholders) for every high-income country in the list.
- **UPI transaction volumes.** The NPCI statistics page could not be read
  programmatically and the only other sources found were news reports, so no
  UPI figure is shown.
- **Money lost to fees, missed savings or avoidable interest.** No recent source
  was found that measures this comparably, or verifiably for India.
