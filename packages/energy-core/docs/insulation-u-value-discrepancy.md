# Possible Double-Counting in Insulation U-Value Calculation

The outer-wall calculator currently uses:

```text
U = 1 / (1/U₀ + Rsi + d/λ + Rse)
```

The simplified official method for a subsequently insulated component uses:

```text
U = 1 / (1/U₀ + d/λ)
```

`U₀` is already the U-value of the complete original component, so `1/U₀`
normally includes its internal and external surface resistances. Adding `Rsi`
and `Rse` again may count them twice.

A useful sanity check is `d = 0`: a catalogue value of `U₀ = 1.5` should
remain `1.5`. The current calculation instead produces approximately `1.20`
solely because `hasInsulation` is true.

Before changing the calculation, confirm whether the configured catalogue
U-values are complete component U-values. If they are, remove the additional
`Rsi` and `Rse` terms and audit the equivalent roof, top-floor, and bottom-floor
calculations.

Sources:

- [German residential-building data-acquisition rules, section 3.3](https://www.geb-info.de/sites/default/files/questions/answers/2023-03/wgdatenaufnahme2013.pdf)
- [GEG § 49: calculation of component U-values](https://www.gesetze-im-internet.de/geg/__49.html)
- [DIN V 18599 building-energy calculation guide](https://www.gebaeudeforum.de/fileadmin/gebaeudeforum/Downloads/Leitfaden-Handbuch/Leitfaden_Bilanzierung_DIN_V_18599_2023_WEB.pdf)
