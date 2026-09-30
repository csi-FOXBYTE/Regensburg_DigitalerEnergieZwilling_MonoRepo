import { createService } from "@csi-foxbyte/fastify-toab";
import { DEFAULT_CONFIG, validateAndMigrate, validateConfig } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import type { Subsidy } from "@csi-foxbyte/regensburg_digitalerenergiezwilling_energycalculationcore";
import { getDatabaseService } from "../@internals/index.js";
import { AppError } from "../errors/app-error.js";

// Reserved version name for the default config
export const DEFAULT_VERSION = "DEFAULT";

export const mockSubsidies = [
  {
    subsidy: {
      title: "BEG WG – Effizienzhaus-Kredit (KfW 261)",
      financing: "loan",
      href: "https://www.kfw.de/261",
      benefits: { unit: "%", type: "range", from: 25, to: 37500 },
      content:
        "Zinsgünstiger Kredit + nicht rückzahlbarer Tilgungszuschuss für die Komplettsanierung zum Effizienzhaus-Standard. Antrag über Hausbank.\n\nTilgungszuschuss je Effizienzhaus- Stufe: \nEH 85: 5 % | EH 70: 10 % | EH 55: 15 % | EH 40: 20 %\n\nBoni(kumulierbar): \n + 5 % Erneuerbare - Energien - Klasse(EE) \n + 10 % Worst Performing Building(WPB: schlechtestes Quartil) \n + 15 % Seriell - Sanierung(vorgefertigte Fassadenmodule) \n\nMax.Kreditbetrag: 120.000 €/WE (150.000 €/WE mit EE -/NH-Klasse) \n\nBedingungen: \n - Bestandsgebäude ≥ 5 Jahre alt\n - Energieeffizienz - Experte(dena - Liste) verpflichtend\n - Antrag vor Auftragsvergabe\n - Nicht kombinierbar mit §35c EStG für dieselben Maßnahmen",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Heizungsförderung – Wohngebäude (KfW 458)",
      financing: "grant",
      href: "https://www.kfw.de/458",
      benefits: { unit: "%", type: "range", from: 80, to: 22400 },
      content:
        'Direktzuschuss für den Austausch alter Heizsysteme gegen erneuerbare Alternativen (Wärmepumpe, Solarthermie, Biomasse, Fernwärme).\n\nMaximaler Zuschuss: 80 % der förderfähigen Kosten\n\nZuschuss-Bausteine:\nGrundförderung\n+16 % Klimageschwindigkeitsbonus (Ersatz von Öl-/Kohle-/Gasetagenheizung, Nachtspeicher oder Gas-/Biomasse-Heizung ≥ 20 Jahre alt) – sinkt ab 01.02.2027 halbjährlich (01.02. / 01.08.) um je 4 Prozentpunkte\n+ Einkommensbonus (Einkommensgrenzen von der KfW noch nicht veröffentlicht)\n\nFörderfähige Kosten je Wohneinheit:\n- 1. WE: 28.000 €\n- WE 2–6: je 15.000 €\n- ab WE 7: je 8.000 €\nDer Höchstbetrag für die 1. WE sinkt erstmals am 01.02.2027 und danach halbjährlich zum 01.02. und 01.08. um je 750 €.\n\nBedingungen:\n- Bestandsgebäude ≥ 5 Jahre alt\n- Hydraulischer Abgleich als Nebenmaßnahme erforderlich\n- Direktantrag über KfW-Portal „Meine KfW“\n- Nicht kombinierbar mit §35c EStG für dieselbe Maßnahme\n\nStand: 09/2026 – einzelne Bonusregelungen sind noch nicht final veröffentlicht.',
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "BEG Einzelmaßnahmen Ergänzungskredit (KfW 358/359)",
      financing: "loan",
      href: "https://www.kfw.de/358",
      benefits: { unit: "€", type: "upTo", value: 120000 },
      content:
        "Zinsgünstiges Darlehen zur Ergänzungsfinanzierung des Eigenanteils nach einem BEG-EM- (BAFA) oder Heizungsförderungs-Zuschuss (KfW 458).\n\nKfW 358 Plus (stark verbilligter Zins, ab 0,01 % eff. p.a.):\n- Nur Eigennutzer mit Haushaltseinkommen ≤ 90.000 €/Jahr\n\nKfW 359 (moderat verbilligter Zins):\n- Alle Eigentümer inkl. Vermieter, WEG, Unternehmen\n\nBedingungen:\n- Setzt bewilligten Zuschuss (KfW 458 oder BAFA BEG EM) voraus\n- Antrag innerhalb von 12 Monaten nach Zuschuss-Bescheid\n- Max. Kreditbetrag: 120.000 €",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "BEG Einzelmaßnahmen – Zuschuss (BAFA)",
      financing: "grant",
      href: "https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude",
      benefits: { unit: "%", type: "range", from: 20, to: 12000 },
      content:
        "Direktzuschuss für einzelne energetische Maßnahmen ohne Effizienzhaus-Ziel.\n\nFörderfähige Maßnahmen:\n- Gebäudehülle: Außenwanddämmung, Dachdämmung, OGD, Kellerdecke, Fenster/Türen (U ≤ 0,95 W/m²K), Sonnenschutz\n- Anlagentechnik: Lüftungsanlage mit WRG, Gebäudeautomation (Klasse B)\n- Heizungsoptimierung: Hydraulischer Abgleich, Pumpentausch, Rohrdämmung\n\nZuschuss:\n15 % Grundförderung\n+5 % iSFP-Bonus (bei Maßnahme aus individuellem Sanierungsfahrplan, max. 15 Jahre nach iSFP-Erstellung)\n\nFörderfähige Kosten: max. 60.000 €/WE (mit iSFP), sonst 30.000 €/WE\n\nTechnische Mindest-U-Werte:\nAußenwand: ≤ 0,20 W/m²K | Dach: ≤ 0,14 W/m²K | Fenster: ≤ 0,95 W/m²K\n\nBedingungen:\n- Bestandsgebäude ≥ 5 Jahre alt\n- Antrag vor Auftragsvergabe\n- Kombinierbar mit KfW 358/359 (Ergänzungskredit)\n- Nicht kombinierbar mit §35c EStG für dieselbe Maßnahme",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Steuerermäßigung energetische Sanierung (§35c EStG)",
      financing: "grant",
      href: "https://www.bundesfinanzministerium.de",
      benefits: { unit: "%", type: "range", from: 20, to: 40000 },
      content:
        "Direkte Minderung der Einkommensteuer für energetische Sanierungsmaßnahmen an selbstgenutztem Wohneigentum – kein separater Antrag, über Steuererklärung.\n\nSteuerbonus: 20 % der Sanierungskosten verteilt auf 3 Jahre:\nJahr 1 + 2: je 7 % (max. 14.000 €/Jahr)\nJahr 3: 6 % (max. 12.000 €)\nGesamtmaximum: 40.000 € je Objekt (auf Basis von max. 200.000 € Kosten)\n\nFörderfähige Maßnahmen: Dämmung, Fenster/Türen, Lüftung, Heizungserneuerung, Gebäudeautomation (nicht: PV-Anlage, Batteriespeicher)\n\nBedingungen:\n- Nur Eigennutzer (Vermieter ausgeschlossen)\n- Gebäude bei Maßnahmenbeginn ≥ 10 Jahre alt\n- Ausführung durch zertifiziertes Fachunternehmen + BMF-Bescheinigung\n- Maßnahme bis 31.12.2029 abgeschlossen\n- Nicht kombinierbar mit BEG WG oder BEG EM für dieselbe Maßnahme\n- Kombinierbar mit BEG EM für andere Maßnahmen am selben Gebäude",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Energieberatung Wohngebäude inkl. iSFP (BAFA)",
      financing: "grant",
      href: "https://www.bafa.de/DE/Energie/Energieberatung/Energieberatung_Wohngebaeude",
      benefits: { unit: "%", type: "range", from: 50, to: 1100 },
      content:
        "Zuschuss für Vor-Ort-Energieberatung und Erstellung eines individuellen Sanierungsfahrplans (iSFP).\n\nZuschusshöhe (50 % der Beratungskosten):\n- Ein-/Zweifamilienhaus: max. 650 €\n- Gebäude ≥ 3 Wohneinheiten: max. 850 €\n- Zusatz bei WEG-Präsentation: +250 €\n\nStrategischer Vorteil: Ein erstellter iSFP aktiviert den +5 %-iSFP-Bonus bei allen nachfolgenden BEG-EM-Maßnahmen (innerhalb von 15 Jahren).\n\nBedingungen:\n- Durchführung durch zugelassenen Energieberater (dena-/BfEE-Expertenliste)\n- Förderzeitraum bis 31.12.2026",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Bayerisches Modernisierungsprogramm (BayModR)",
      financing: "loan",
      href: "https://www.bayernlabo.de/mietwohnraum/bayerisches-modernisierungsprogramm",
      benefits: { unit: "€/m²", type: "upTo", value: 500 },
      content:
        "Zinsgünstiges Darlehen + Zuschuss für Modernisierungsmaßnahmen an Mietwohngebäuden. Antrag bei BayernLabo / Regierung Oberpfalz.\n\nZuschuss: bis zu 500 €/m² Wohnfläche\n- Basiszuschuss: bis 300 €/m²\n- Nachhaltigkeitszuschuss: bis weitere 200 €/m²\n- Max. Zuschuss: 25 % des bewilligten Darlehens\n\nDarlehen: bis zu 100 % der förderfähigen Kosten (Mindestkosten 5.000 €/WE)\n\nFörderfähige Maßnahmen: Energetische Sanierung, Barrierefreiheit, Sanitärinstallationen, Erneuerbare Energien u. v. m.\n\nBedingungen:\n- Nur Vermieter (mind. 3 Mietwohnungen im Gebäude)\n- Gebäude ≥ 15 Jahre alt (≥ 5 Jahre bei Kombination mit BEG)\n- Belegungsbindung 10 Jahre nach Fertigstellung\n- Antrag vor Maßnahmenbeginn\n- Kombinierbar mit BEG WG und BEG EM",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Regensburg effizient – Sanierung (nachwachsende Rohstoffe)",
      financing: "grant",
      href: "https://www.regensburg.de/greendeal/mitmachen/staedtische-foerderungen-zum-klimaschutz",
      benefits: { unit: "€", type: "upTo", value: 10000 },
      content:
        "Städtischer Zuschuss der Stadt Regensburg für Gebäudehüllensanierung ausschließlich mit nachwachsenden Rohstoffen.\n\nFördersätze:\n- Ökologische Wärmedämmung (nachwachsende Rohstoffe): 15 €/m² gedämmter Fläche\n- Holzfenster / Holzaußentüren: 20 €/m² Bauteilfläche\n- Holz-Aluminium-Fenster/-Türen: 15 €/m² Bauteilfläche\n\nBedingungen:\n- Bestandsgebäude ≥ 5 Jahre alt, max. 10 Wohneinheiten\n- Max. 2 verschiedene Maßnahmen je Liegenschaft\n- Max. 10.000 € Gesamtzuschuss je Liegenschaft (nicht je WE)\n- Antrag vor Maßnahmenbeginn bei der Stadt Regensburg\n- Kombinierbar mit BEG EM (BAFA)\n- Kontakt: klimaschutz@regensburg.de | Tel. 0941/507-3022",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Regensburg effizient – Photovoltaik",
      financing: "grant",
      href: "https://www.regensburg.de/greendeal/mitmachen/staedtische-foerderungen-zum-klimaschutz",
      benefits: { unit: "€", type: "upTo", value: 1500 },
      content:
        "Städtischer Zuschuss der Stadt Regensburg für neu installierte PV-Anlagen.\n\nFördersätze:\n- Standard (Dach): 100 €/kWp, max. 1.500 €\n- Denkmalgeschütztes Gebäude oder Fassadeninstallation: 200 €/kWp\n\nBedingungen:\n- Antrag vor Kauf/Installationsbeginn\n- Eine Förderung je Gebäude\n- Antragsberechtigt: Privatpersonen, Unternehmen, WEGs",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "Regensburg resilient – Gebäudebegrünung",
      financing: "grant",
      href: "https://www.regensburg.de/greendeal/mitmachen/staedtische-foerderungen-zum-klimaschutz",
      benefits: { unit: "€", type: "upTo", value: 4000 },
      content:
        "Städtischer Zuschuss der Stadt Regensburg für Dach- und Fassadenbegrünung sowie Entsiegelungsmaßnahmen (Klimaanpassung: Hitzeschutz, Regenwasser).\n\nFörderbetrag: bis zu 4.000 € je Maßnahme / Liegenschaft\n\nBedingungen:\n- Antrag vor Maßnahmenbeginn\n- Maßnahme an bestehendem Gebäude\n- Programm läuft bis 31.12.2026",
    },
    isActive: true,
  },
  {
    subsidy: {
      title: "REWAG – Förderung Photovoltaik",
      financing: "grant",
      href: "https://www.rewag.de/foerderungen",
      benefits: { unit: "€", type: "upTo", value: 400 },
      content:
        "Zuschuss der REWAG (Stadtwerk Regensburg) aus dem Grüner-Strom-Label-Fonds.\n\nFördersätze:\n- PV-Anlage (Dach/Fassade): bis 400 €\n- Balkonkraftwerk / Mini-PV: 50 €\n- Post-EEG-Anlagen bis 5,5 kWp: bis 240 €\n\nBedingungen:\n- Aktiver Energieliefervertrag mit REWAG erforderlich (Tarif rewario.strom.natur.regio oder rewario.strom.mobil)\n- Gebäude im Versorgungsgebiet Regensburg\n- Kombinierbar mit Regensburg effizient – Photovoltaik",
    },
    isActive: true,
  },
] satisfies { subsidy: Subsidy; isActive: boolean }[];

const configService = createService("config", async ({ services }) => {
  const db = await getDatabaseService(services);
  // The virtual default config: not persisted, synthesized live from the installed
  // package. It is "in effect" whenever no real config is active, so that the app
  // works on an empty database without a seed. Submissions calculated with it store
  // a null usedConfigId (see submissions.service).
  const buildDefaultConfig = (isActive: boolean) => {
    const now = new Date("2026-01-01");
    return {
      id: DEFAULT_VERSION,
      createdAt: now,
      updatedAt: now,
      versionName: DEFAULT_VERSION,
      isActive,
      publishedAt: null as Date | null,
      calculationConfig: JSON.stringify(DEFAULT_CONFIG),
      subsidies: [JSON.stringify(mockSubsidies)],
    };
  };

  const getConfigs = async () => {
    const configs = await db.config.findMany({});
    // Always surface the default so the frontend has something to show even on an
    // empty database. Only synthesized when no persisted "default" row exists
    if (configs.some((c) => c.versionName === DEFAULT_VERSION)) return configs;
    const anyActive = configs.some((c) => c.isActive);
    return [buildDefaultConfig(!anyActive), ...configs];
  }

  const getConfig = async (versionName: string) => {
    if (versionName === DEFAULT_VERSION) {
      const activeCount = await db.config.count({ where: { isActive: true } });
      return buildDefaultConfig(activeCount < 1);
    }
    const config = await db.config.findUnique({ where: { versionName } });
    if (config == null) {
      throw new AppError({ status: "NOT_FOUND", code: 404, message: `Version "${versionName}" not found` });
    }
    const result = validateAndMigrate(JSON.parse(config.calculationConfig));
    if (!result.success) {
      throw new AppError({ status: "INTERNAL_ERROR", code: 500, message: `Config "${versionName}" is invalid: ${result.issues.map(i => `${i.path}: ${i.message}`).join(", ")}` });
    }
    if (result.migrated) {
      return db.config.update({
        where: { versionName },
        data: { calculationConfig: JSON.stringify(result.data) },
      });
    }
    return config;
  }

  const createConfig = async (versionName: string, calculationConfig: string, subsidies: string[]) => {
    if (versionName === DEFAULT_VERSION) {
      throw new AppError({ status: "BAD_REQUEST", code: 400, message: `Version "${DEFAULT_VERSION}" is reserved` });
    }
    const existing = await db.config.findUnique({ where: { versionName } });
    if (existing != null) {
      throw new AppError({ status: "BAD_REQUEST", code: 409, message: `Version "${versionName}" already exists` });
    }
    const result = validateConfig(JSON.parse(calculationConfig));
    if (!result.success) {
      throw new AppError({ status: "BAD_REQUEST", code: 400, message: `Invalid calculationConfig: ${result.issues.map(i => `${i.path}: ${i.message}`).join(", ")}` });
    }
    return db.config.create({
      data: { versionName, calculationConfig, subsidies },
    });
  }

  const activateConfig = async (versionName: string) => {
    if (versionName === DEFAULT_VERSION) {
      await db.config.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return buildDefaultConfig(true);
    }
    const target = await db.config.findUnique({ where: { versionName } });
    if (target == null) {
      throw new AppError({ status: "NOT_FOUND", code: 404, message: `Version "${versionName}" not found` });
    }
    const result = validateConfig(JSON.parse(target.calculationConfig));
    if (!result.success) {
      throw new AppError({ status: "BAD_REQUEST", code: 400, message: `Config "${versionName}" is invalid and cannot be activated: ${result.issues.map(i => `${i.path}: ${i.message}`).join(", ")}` });
    }
    return db.$transaction(async (tx) => {
      await tx.config.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return tx.config.update({
        where: { versionName },
        data: { isActive: true, publishedAt: new Date() },
      });
    });
  }

  const getActiveConfig = async () => {
    const config = await db.config.findFirst({ where: { isActive: true } });
    if (config == null)
      return buildDefaultConfig(true);
    const result = validateAndMigrate(JSON.parse(config.calculationConfig));
    if (!result.success) {
      throw new AppError({ status: "INTERNAL_ERROR", code: 500, message: `Active config is invalid: ${result.issues.map(i => `${i.path}: ${i.message}`).join(", ")}` });
    }
    if (result.migrated) {
      return { ...config, calculationConfig: JSON.stringify(result.data) };
    }
    return config;
  }

  const deleteConfig = async (versionName: string) => {
    if (versionName === DEFAULT_VERSION) {
      throw new AppError({ status: "FORBIDDEN", code: 403, message: `The "${DEFAULT_VERSION}" config cannot be deleted` });
    }
    const config = await db.config.findUnique({ where: { versionName} });
    // No "at least one config" guard needed: the virtual default is always
    // available as a fallback, so deleting the last persisted config is safe.
    if (config == null) {
      throw new AppError({ status: "NOT_FOUND", code: 404, message: `Version "${versionName}" not found` });
    }
    if (config.isActive) {
      throw new AppError({ status: "BAD_REQUEST", code: 409, message: `Cannot delete active config "${versionName}"` });
    }
    return db.config.delete({ where: { versionName } });
  }

  return {
    getConfigs, getConfig, createConfig, activateConfig, getActiveConfig, deleteConfig
  }

});

export default configService;
