# Figma parity

Component set `Mascot/Buddy App` vs the code resting frames, 480 px, both on #F4F4F2.

- Name sync: Figma 85 variants, code 85 keys. Missing in Figma: none. Missing in code: none.
- Tolerance: flag when more than 0.3 percent of pixels differ by more than 24/255, or silhouette XOR above 0.1 percent.
- Matched 85, flagged 0: none.

| key | status | % over delta | % over 8 | max diff | silhouette XOR % | diff bbox |
|---|---|---|---|---|---|---|
| hello | match | 0.0009 | 0.0955 | 29 | 0.0252 | [244, 247, 284, 335] |
| welcome-team | match | 0.003 | 0.1454 | 32 | 0.0295 | [172, 142, 264, 333] |
| setup-event | match | 0.0078 | 0.0938 | 36 | 0.0091 | [300, 192, 439, 208] |
| all-set | match | 0.1181 | 0.2188 | 91 | 0.0312 | [154, 189, 325, 280] |
| no-events | match | 0.0 | 0.0738 | 24 | 0.0382 | None |
| no-songs | match | 0.0 | 0.0964 | 24 | 0.0469 | None |
| no-team | match | 0.0 | 0.0634 | 21 | 0.0386 | None |
| no-notifications | match | 0.1302 | 0.2214 | 82 | 0.0391 | [102, 251, 288, 337] |
| no-results | match | 0.0126 | 0.217 | 43 | 0.0282 | [99, 193, 414, 294] |
| no-sunday | match | 0.0052 | 0.1376 | 26 | 0.0135 | [73, 94, 389, 139] |
| event-created | match | 0.0091 | 0.1398 | 36 | 0.0109 | [148, 184, 427, 345] |
| saved | match | 0.0408 | 0.1602 | 30 | 0.0178 | [143, 155, 380, 268] |
| invite-sent | match | 0.0004 | 0.0946 | 26 | 0.0252 | [206, 277, 206, 277] |
| everyone-confirmed | match | 0.0017 | 0.1302 | 27 | 0.026 | [57, 340, 324, 343] |
| plan-ready | match | 0.0009 | 0.0894 | 28 | 0.0204 | [279, 271, 298, 271] |
| done | match | 0.0017 | 0.1437 | 27 | 0.0148 | [152, 256, 404, 345] |
| rehearsal | match | 0.0091 | 0.1367 | 44 | 0.0169 | [170, 230, 455, 351] |
| scheduled | match | 0.0013 | 0.1376 | 29 | 0.0213 | [214, 176, 258, 183] |
| waiting | match | 0.0 | 0.0924 | 23 | 0.023 | None |
| declined | match | 0.0 | 0.0764 | 23 | 0.0339 | None |
| unavailable | match | 0.0907 | 0.2682 | 74 | 0.0174 | [101, 279, 396, 389] |
| new-message | match | 0.0026 | 0.1332 | 36 | 0.0642 | [177, 328, 206, 340] |
| offline | match | 0.0074 | 0.1554 | 37 | 0.0126 | [205, 281, 346, 374] |
| oops | match | 0.0004 | 0.0755 | 27 | 0.0347 | [115, 405, 115, 405] |
| no-access | match | 0.0013 | 0.1432 | 28 | 0.0135 | [327, 210, 376, 219] |
| loading | match | 0.0265 | 0.1688 | 88 | 0.0577 | [55, 249, 396, 369] |
| session-expired | match | 0.1619 | 0.388 | 100 | 0.0178 | [118, 136, 431, 371] |
| happy | match | 0.0017 | 0.0877 | 29 | 0.0182 | [172, 252, 230, 333] |
| thinking | match | 0.0 | 0.056 | 23 | 0.0269 | None |
| surprised | match | 0.0425 | 0.1319 | 74 | 0.0208 | [221, 300, 258, 340] |
| proud | match | 0.1111 | 0.2018 | 85 | 0.0273 | [150, 216, 323, 320] |
| sleepy | match | 0.227 | 0.3772 | 141 | 0.0343 | [146, 129, 387, 337] |
| sure | match | 0.0 | 0.0608 | 23 | 0.0321 | None |
| idle | match | 0.0 | 0.0638 | 24 | 0.0182 | None |
| excited | match | 0.0 | 0.0742 | 22 | 0.0312 | None |
| thankful | match | 0.1454 | 0.2361 | 107 | 0.0304 | [147, 248, 333, 338] |
| wink | match | 0.0009 | 0.0751 | 29 | 0.0278 | [284, 246, 288, 248] |
| confused | match | 0.003 | 0.0751 | 39 | 0.0278 | [216, 308, 254, 332] |
| sad | match | 0.0469 | 0.1176 | 98 | 0.0247 | [221, 328, 268, 348] |
| shy | match | 0.0 | 0.0651 | 19 | 0.0143 | None |
| talking | match | 0.0 | 0.0681 | 22 | 0.0174 | None |
| shrug | match | 0.0 | 0.0582 | 20 | 0.0247 | None |
| goodbye | match | 0.0 | 0.092 | 21 | 0.0252 | None |
| welcome-back | match | 0.0009 | 0.0842 | 27 | 0.0243 | [61, 261, 113, 323] |
| nervous | match | 0.0078 | 0.0825 | 36 | 0.0243 | [214, 279, 323, 336] |
| focused | match | 0.0 | 0.0464 | 22 | 0.0321 | None |
| laughing | match | 0.0777 | 0.1623 | 83 | 0.0286 | [149, 248, 332, 300] |
| curious | match | 0.0043 | 0.0964 | 33 | 0.0282 | [189, 235, 301, 407] |
| determined | match | 0.0 | 0.0642 | 21 | 0.0226 | None |
| on-it | match | 0.0 | 0.0534 | 23 | 0.0326 | None |
| sorry | match | 0.0516 | 0.1649 | 45 | 0.0239 | [150, 254, 328, 336] |
| peek | match | 0.0004 | 0.0777 | 25 | 0.0043 | [299, 427, 299, 427] |
| pointing | match | 0.0009 | 0.0734 | 25 | 0.02 | [142, 236, 201, 331] |
| pointup | match | 0.0004 | 0.0699 | 25 | 0.0217 | [249, 331, 249, 331] |
| pointdown | match | 0.0004 | 0.0729 | 25 | 0.0217 | [249, 331, 249, 331] |
| pointleft | match | 0.0004 | 0.0703 | 25 | 0.02 | [297, 331, 297, 331] |
| thumbsup | match | 0.0017 | 0.0872 | 29 | 0.0208 | [148, 252, 206, 333] |
| clapping | match | 0.0017 | 0.0968 | 29 | 0.0247 | [172, 252, 230, 333] |
| highfive | match | 0.0004 | 0.1471 | 27 | 0.0321 | [361, 352, 361, 352] |
| running | match | 0.0 | 0.0616 | 23 | 0.0373 | None |
| reading | match | 0.0 | 0.2036 | 23 | 0.0165 | None |
| planning | match | 0.0013 | 0.1845 | 28 | 0.0104 | [308, 213, 429, 369] |
| phone | match | 0.0026 | 0.0977 | 34 | 0.0113 | [323, 255, 377, 353] |
| laptop | match | 0.0022 | 0.0629 | 32 | 0.0022 | [97, 395, 382, 416] |
| carrying | match | 0.0395 | 0.0846 | 82 | 0.0217 | [150, 152, 261, 333] |
| sign | match | 0.0 | 0.0859 | 21 | 0.0143 | None |
| megaphone | match | 0.0074 | 0.1389 | 38 | 0.0109 | [166, 253, 400, 369] |
| reminder | match | 0.0004 | 0.1024 | 25 | 0.013 | [186, 351, 186, 351] |
| lost | match | 0.0069 | 0.1233 | 35 | 0.0165 | [141, 296, 398, 345] |
| maintenance | match | 0.0026 | 0.1667 | 28 | 0.0143 | [285, 151, 366, 247] |
| idea | match | 0.0035 | 0.1324 | 38 | 0.0265 | [223, 306, 254, 340] |
| slides | match | 0.0043 | 0.2769 | 29 | 0.0082 | [252, 211, 457, 317] |
| swap | match | 0.0095 | 0.1697 | 39 | 0.0217 | [311, 155, 407, 304] |
| qrcode | match | 0.0 | 0.1163 | 20 | 0.013 | None |
| link | match | 0.0017 | 0.1424 | 26 | 0.0152 | [313, 270, 389, 336] |
| new-feature | match | 0.0009 | 0.1137 | 29 | 0.0156 | [158, 351, 286, 384] |
| export | match | 0.0 | 0.0634 | 19 | 0.0126 | None |
| listening | match | 0.0026 | 0.2014 | 28 | 0.0195 | [80, 212, 249, 331] |
| singing | match | 0.0191 | 0.1997 | 39 | 0.0122 | [190, 83, 430, 351] |
| playing | match | 0.0052 | 0.158 | 34 | 0.02 | [167, 247, 382, 382] |
| keyboard | match | 0.0 | 0.0981 | 23 | 0.0061 | None |
| drums | match | 0.0056 | 0.1801 | 38 | 0.0174 | [65, 92, 334, 408] |
| mixing | match | 0.0022 | 0.1168 | 27 | 0.0017 | [65, 321, 414, 416] |
| transpose | match | 0.0 | 0.1215 | 20 | 0.0126 | None |
| setlist | match | 0.0 | 0.3108 | 23 | 0.0143 | None |

## Tolerance evidence

Percent of pixels over delta 24: median 0.0017, p90 0.0516, max 0.227 (threshold 0.3). Differences on matching states are 1 px rings around thin strokes (rasteriser antialiasing and sub-pixel stroke geometry), not moved or missing shapes.

## Fixes and descriptions

- Redrawn in Figma: none. All 85 variants are within tolerance, so no variant was touched and `before/` is empty.
- Dry run: the redraw pattern (createNodeFromSvg, move children into the variant, remove the temp node) was tested on a
  throwaway component, not on a variant. It rendered with the same numbers as the existing `hello` variant (0.0009 percent
  over delta, max diff 29), which shows the variants were drawn from the same SVG. The throwaway was removed.
- Descriptions written: 85 variant components plus the component set (sync paragraph appended to the existing text).
- Export method: temporary 2x instances (480 px) of each variant were screenshotted with get_screenshot and removed again.
  The set, the board and all other nodes were not modified.
