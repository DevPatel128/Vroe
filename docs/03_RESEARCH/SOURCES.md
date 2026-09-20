# Sources

**Status:** Approved · **Last updated:** 2026-09-19 · **Owner:** Vroe Labs · **Version:** 1.0

The index of every source document behind the evidence layer: where each file came
from, its size and SHA-256, and what it was used for. The method and the rules that
govern the figures are in [RESEARCH.md](RESEARCH.md). The files themselves are in
[impact-research/](impact-research/README.md).

`raw/` is not in git (about 125 MB). Every file is listed below with the URL it
came from and its SHA-256, so anyone can download the same bytes and confirm they
match:

```bash
shasum -a 256 impact-research/raw/india/MoSPI-TUS-2024-Person-Level-Data-CSV.zip
```

All files were retrieved on 13 September 2026. Sources set aside, and why, are in
[ARCHIVE/README.md](ARCHIVE/README.md).

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
