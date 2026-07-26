/* ==========================================================================
   pv-model.js  ·  Geteiltes PV-Unabhängigkeitsmodell (reine Berechnung, kein DOM)
   --------------------------------------------------------------------------
   Quelle der Wahrheit für Ertrag-je-Ausrichtung (PVGIS-Näherung) und die
   Autarkie-/Eigenverbrauchs-Kurven (an die Methodik der HTW Berlin angelehnt,
   Forschungsgruppe Quaschning). Wird vom Detailrechner auf unabhaengigkeit.html
   genutzt. nutzen.html enthält dieselbe Logik noch inline — Migration hierher
   ist ein späterer Folgeschritt.

   WICHTIG (Positionierung): Dieses Modell ist eine EIGENE Schätzung. Es ist NICHT
   der HTW-Rechner und darf nicht als HTW-Berechnung ausgegeben werden. Der echte
   HTW-Solarisator läuft als iframe daneben.
   ========================================================================== */
(function (global) {
  'use strict';

  // --- Ertrag je Ausrichtung × Neigung (relativ zur Süd-Optimallage, PVGIS-Näherung) ---
  var TILT_ORIENT = {
    S:  { flach:0.93, mittel:1.00, steil:0.96, vertikal:0.71 },
    SO: { flach:0.92, mittel:0.96, steil:0.92, vertikal:0.66 },
    SW: { flach:0.92, mittel:0.96, steil:0.92, vertikal:0.66 },
    O:  { flach:0.89, mittel:0.83, steil:0.76, vertikal:0.55 },
    W:  { flach:0.89, mittel:0.83, steil:0.76, vertikal:0.55 },
    NO: { flach:0.85, mittel:0.72, steil:0.60, vertikal:0.42 },
    NW: { flach:0.85, mittel:0.72, steil:0.60, vertikal:0.42 },
    N:  { flach:0.82, mittel:0.62, steil:0.48, vertikal:0.32 }
  };
  var SHADE = { keine:1.00, gering:0.92, stark:0.78 };
  var ORIENT_LABEL = { S:'Süd', SW:'Südwest', SO:'Südost', W:'West', O:'Ost', N:'Nord', NW:'Nordwest', NO:'Nordost' };
  var ORIENT_OPTS = ['O','SO','S','SW','W','N'];
  var TILT_OPTS   = [['flach','≤ 15°'],['mittel','20–35°'],['steil','≥ 40°'],['vertikal','Fassade']];
  var SHADE_OPTS  = ['keine','gering','stark'];
  var BASE_YIELD  = 950;         // kWh/kWp·a DE-Mittel (PVGIS)
  var EV_KWH_PER_KM = 0.20;      // kWh/km
  var EV_KWH_DEFAULT = 3000;     // ~15.000 km
  var WP_KWH_DEFAULT = 3500;     // typischer WP-Jahresstrombedarf EFH
  var NEG_PRICE_HOURS_2025 = 573; // Negativpreis-Stunden 2025 (Bundesnetzagentur)

  // --- PLZ-Präfix → Regionalertrag (kWh/kWp·a) + Regionname (PVGIS/DWD-Näherung) ---
  var PLZ = {
    "01":["Dresden/Meißen",980],"02":["Görlitz/Bautzen",985],"03":["Cottbus/Lausitz",985],
    "04":["Leipzig",975],"06":["Halle/Dessau",975],"07":["Gera/Jena",970],"08":["Zwickau/Plauen",970],
    "09":["Chemnitz/Erzgebirge",965],"10":["Berlin Mitte",985],"11":["Berlin",985],"12":["Berlin Süd",985],
    "13":["Berlin Nord",985],"14":["Potsdam/Brandenburg",985],"15":["Frankfurt (Oder)",980],
    "16":["Oranienburg/Eberswalde",975],"17":["Neubrandenburg/Greifswald",950],"18":["Rostock/Stralsund",955],
    "19":["Schwerin/Ludwigslust",950],"20":["Hamburg Mitte",945],"21":["Hamburg Süd/Lüneburg",945],
    "22":["Hamburg Nord/West",945],"23":["Lübeck/Wismar",945],"24":["Kiel/Flensburg",950],
    "25":["Westküste/Sylt",955],"26":["Oldenburg/Emden",940],"27":["Bremerhaven/Cuxhaven",940],
    "28":["Bremen",940],"29":["Celle/Uelzen",950],"30":["Hannover",955],"31":["Hameln/Hildesheim",955],
    "32":["Herford/Minden",950],"33":["Bielefeld/Paderborn",955],"34":["Kassel",960],"35":["Gießen/Marburg",965],
    "36":["Fulda/Bad Hersfeld",965],"37":["Göttingen/Eschwege",955],"38":["Braunschweig/Wolfsburg",955],
    "39":["Magdeburg/Stendal",965],"40":["Düsseldorf",965],"41":["Mönchengladbach/Neuss",965],
    "42":["Wuppertal/Solingen",960],"44":["Dortmund/Bochum",960],"45":["Essen/Gelsenkirchen",960],
    "46":["Oberhausen/Wesel",960],"47":["Duisburg/Krefeld",965],"48":["Münster/Coesfeld",960],
    "49":["Osnabrück/Lingen",955],"50":["Köln",975],"51":["Köln Ost/Leverkusen",975],"52":["Aachen/Düren",970],
    "53":["Bonn/Siegburg",980],"54":["Trier/Bitburg",985],"55":["Mainz/Bad Kreuznach",1010],
    "56":["Koblenz/Neuwied",985],"57":["Siegen/Olpe",960],"58":["Hagen/Iserlohn",960],"59":["Hamm/Arnsberg",960],
    "60":["Frankfurt am Main",1015],"61":["Bad Homburg/Friedberg",1010],"63":["Aschaffenburg/Hanau",1015],
    "64":["Darmstadt",1020],"65":["Wiesbaden/Limburg",1015],"66":["Saarbrücken/Homburg",1010],
    "67":["Ludwigshafen/Kaiserslautern",1030],"68":["Mannheim",1035],"69":["Heidelberg",1030],
    "70":["Stuttgart",1030],"71":["Stuttgart/Ludwigsburg",1030],"72":["Tübingen/Reutlingen",1035],
    "73":["Göppingen/Esslingen",1035],"74":["Heilbronn/Schwäbisch Hall",1030],"75":["Pforzheim/Calw",1030],
    "76":["Karlsruhe/Baden-Baden",1040],"77":["Offenburg/Lahr",1050],"78":["Villingen-Schwenningen",1060],
    "79":["Freiburg/Lörrach",1080],"80":["München",1080],"81":["München Süd/Ost",1080],
    "82":["Garmisch/Starnberg",1100],"83":["Rosenheim/Traunstein",1090],"84":["Landshut/Dingolfing",1075],
    "85":["Ingolstadt/Freising",1070],"86":["Augsburg/Donauwörth",1080],"87":["Kempten/Allgäu",1100],
    "88":["Friedrichshafen/Ravensburg",1090],"89":["Ulm/Heidenheim",1070],"90":["Nürnberg/Fürth",1040],
    "91":["Erlangen/Ansbach",1035],"92":["Amberg/Weiden",1030],"93":["Regensburg/Cham",1040],
    "94":["Passau/Straubing",1050],"95":["Hof/Bayreuth",1010],"96":["Bamberg/Coburg",1030],
    "97":["Würzburg/Schweinfurt",1030],"98":["Suhl/Ilmenau",980],"99":["Erfurt/Weimar",985]
  };

  function tiltOrientFactor(o, t) {
    var r = TILT_ORIENT[o] || TILT_ORIENT.S;
    return r[t] != null ? r[t] : (r.mittel || 1);
  }

  // PLZ (5-stellig oder Präfix) → { region, yield } (kWh/kWp·a)
  function regionForPlz(plz) {
    var p = String(plz || '').replace(/\D/g, '').substring(0, 2);
    var e = PLZ[p];
    return e ? { region: e[0], yield: e[1] } : { region: 'Deutschland', yield: BASE_YIELD };
  }

  // Ertrag + kWp für eine Dachfläche { modules, modulePower, orientation, tilt, shading }
  function surfaceYield(s, baseYield) {
    var by = baseYield || BASE_YIELD;
    var modWp = s.modulePower > 0 ? s.modulePower : 440;
    var kWp = (s.modules > 0 ? s.modules : 0) * modWp / 1000;
    var y = kWp * by * tiltOrientFactor(s.orientation, s.tilt) * (SHADE[s.shading] || 1);
    return { kWp: kWp, yield: y };
  }

  // --- Kern: Autarkie & Eigenverbrauch ---
  // Eingaben:
  //   consumptionKwh : Jahresstromverbrauch inkl. optional WP/E-Auto (kWh)
  //   kWp            : gesamte PV-Leistung
  //   pvYield        : gesamter PV-Jahresertrag (kWh)
  //   battKwh        : nutzbare Speicherkapazität (kWh)
  //   emsOn          : intelligentes Energiemanagement aktiv?
  // Rückgabe: autarkie%, eigenverbrauch%, kWh-Aufteilung, Überschuss-/Regulierungsinfos.
  function computeIndependence(inp) {
    var consumption = Math.max(0, inp.consumptionKwh || 0);
    var pvYield = Math.max(0, inp.pvYield || 0);
    var battKwh = Math.max(0, inp.battKwh || 0);
    var hasBattery = battKwh > 0;
    var emsOn = !!inp.emsOn;

    var demandMWh = Math.max(0.1, consumption / 1000);
    var pvPerMWh  = (inp.kWp || 0) / demandMWh;   // spez. PV (kWp je MWh Verbrauch)
    var battPerMWh = battKwh / demandMWh;         // spez. Speicher (kWh je MWh Verbrauch)

    // Sättigende Kurven (an HTW-Logik angelehnt): Direktnutzung + Speicher-Nachtnutzung.
    var autarkFrac = 0.45 * (1 - Math.exp(-1.1 * pvPerMWh));
    if (hasBattery) autarkFrac += 0.60 * (1 - Math.exp(-1.4 * battPerMWh)) * (1 - autarkFrac);
    if (emsOn)      autarkFrac += (hasBattery ? 0.10 : 0.05) * (1 - autarkFrac);
    autarkFrac = Math.min(autarkFrac, 0.92);

    var pvSelbst = Math.min(consumption * autarkFrac, pvYield); // selbst genutzter PV-Strom
    var pvExport = Math.max(0, pvYield - pvSelbst);             // Überschuss ins Netz
    var netElec  = Math.max(0, consumption - pvSelbst);         // Reststrom aus dem Netz
    var autarkie = consumption > 0 ? Math.min(100, pvSelbst / consumption * 100) : 0;
    var eigenverbrauch = pvYield > 0 ? Math.min(100, pvSelbst / pvYield * 100) : 0;

    return {
      autarkie: autarkie,               // % des Verbrauchs aus eigenem PV-Strom
      eigenverbrauch: eigenverbrauch,   // % des PV-Stroms selbst genutzt
      pvSelbst: pvSelbst,
      pvExport: pvExport,
      netElec: netElec,
      pvYield: pvYield,
      consumption: consumption,
      battKwh: battKwh,
      emsOn: emsOn,
      negPriceHours: NEG_PRICE_HOURS_2025
    };
  }

  global.PVModel = {
    TILT_ORIENT: TILT_ORIENT, SHADE: SHADE, ORIENT_LABEL: ORIENT_LABEL,
    ORIENT_OPTS: ORIENT_OPTS, TILT_OPTS: TILT_OPTS, SHADE_OPTS: SHADE_OPTS,
    BASE_YIELD: BASE_YIELD, EV_KWH_PER_KM: EV_KWH_PER_KM, EV_KWH_DEFAULT: EV_KWH_DEFAULT,
    WP_KWH_DEFAULT: WP_KWH_DEFAULT, NEG_PRICE_HOURS_2025: NEG_PRICE_HOURS_2025,
    tiltOrientFactor: tiltOrientFactor,
    regionForPlz: regionForPlz,
    surfaceYield: surfaceYield,
    computeIndependence: computeIndependence
  };
})(typeof window !== 'undefined' ? window : this);
