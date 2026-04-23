// constants/categoryFields.ts

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'boolean'
  | 'date'
  | 'energy_class'
  | 'dpe_class';

export interface FieldOption {
  value: string;
  label: string;
}

export interface CategoryField {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  unit?: string;
  placeholder?: string;
}

const FUEL_OPTIONS: FieldOption[] = [
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'gpl', label: 'GPL' },
  { value: 'hydrogene', label: 'Hydrogène' },
];

const ENERGY_CLASS_OPTIONS: FieldOption[] = [
  { value: 'A+++', label: 'A+++' },
  { value: 'A++', label: 'A++' },
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
];

const DPE_CLASS_OPTIONS: FieldOption[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
];

export const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  realestate: [
    {
      key: 'property_type', label: 'Type de bien', type: 'select',
      options: [
        { value: 'maison', label: 'Maison' },
        { value: 'appartement', label: 'Appartement' },
        { value: 'residence-secondaire', label: 'Résidence secondaire' },
        { value: 'terrain', label: 'Terrain' },
        { value: 'garage', label: 'Garage / Box' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'surface_m2', label: 'Surface', type: 'number', unit: 'm²' },
    { key: 'build_year', label: 'Année de construction', type: 'number' },
    { key: 'rooms', label: 'Nombre de pièces', type: 'number' },
    { key: 'floor', label: 'Étage', type: 'number' },
    { key: 'dpe_class', label: 'DPE', type: 'dpe_class', options: DPE_CLASS_OPTIONS },
    { key: 'ges_class', label: 'GES (émissions CO₂)', type: 'dpe_class', options: DPE_CLASS_OPTIONS },
    { key: 'has_insurance', label: 'Assurance habitation', type: 'boolean' },
    { key: 'insurer_name', label: 'Nom de l\'assureur', type: 'text', placeholder: 'Maif, Axa...' },
    { key: 'land_tax', label: 'Taxe foncière annuelle', type: 'number', unit: '€' },
    { key: 'has_syndic', label: 'Syndic de copropriété', type: 'boolean' },
    { key: 'syndic_name', label: 'Nom du syndic', type: 'text' },
  ],

  car: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Renault, Peugeot...' },
    { key: 'model', label: 'Modèle', type: 'text', placeholder: 'Clio, 308...' },
    { key: 'year', label: 'Année', type: 'number', placeholder: '2020' },
    { key: 'plate', label: 'Immatriculation', type: 'text', placeholder: 'AB-123-CD' },
    { key: 'vin', label: 'Numéro VIN', type: 'text', placeholder: 'VF1...' },
    { key: 'fuel', label: 'Carburant', type: 'select', options: FUEL_OPTIONS },
    { key: 'mileage', label: 'Kilométrage', type: 'number', unit: 'km' },
    { key: 'power_cv', label: 'Puissance', type: 'number', unit: 'ch' },
    {
      key: 'gearbox', label: 'Boîte de vitesses', type: 'select',
      options: [
        { value: 'manuelle', label: 'Manuelle' },
        { value: 'automatique', label: 'Automatique' },
        { value: 'semi-automatique', label: 'Semi-automatique' },
      ],
    },
    { key: 'color', label: 'Couleur', type: 'text' },
    { key: 'technical_control_date', label: 'Contrôle technique', type: 'date' },
  ],

  moto: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Honda, Yamaha...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'year', label: 'Année', type: 'number' },
    { key: 'plate', label: 'Immatriculation', type: 'text' },
    { key: 'displacement', label: 'Cylindrée', type: 'number', unit: 'cc' },
    { key: 'fuel', label: 'Carburant', type: 'select', options: FUEL_OPTIONS },
    { key: 'mileage', label: 'Kilométrage', type: 'number', unit: 'km' },
    {
      key: 'license', label: 'Permis requis', type: 'select',
      options: [
        { value: 'A', label: 'A' },
        { value: 'A2', label: 'A2' },
        { value: 'A1', label: 'A1' },
        { value: 'AM', label: 'AM (50cc)' },
      ],
    },
    { key: 'color', label: 'Couleur', type: 'text' },
  ],

  bike: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Trek, Specialized...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    {
      key: 'bike_type', label: 'Type', type: 'select',
      options: [
        { value: 'vtt', label: 'VTT' },
        { value: 'route', label: 'Route' },
        { value: 'ville', label: 'Ville' },
        { value: 'gravel', label: 'Gravel' },
        { value: 'electrique', label: 'Électrique (VAE)' },
        { value: 'cargo', label: 'Cargo' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
    { key: 'frame_size', label: 'Taille cadre', type: 'text', placeholder: 'M, L, 54cm...' },
    { key: 'is_ebike', label: 'Assistance électrique (VAE)', type: 'boolean' },
    { key: 'motor_brand', label: 'Marque moteur', type: 'text', placeholder: 'Bosch, Shimano...' },
    { key: 'battery_range', label: 'Autonomie batterie', type: 'number', unit: 'km' },
  ],

  scooter: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Xiaomi, Ninebot...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    {
      key: 'scooter_type', label: 'Type', type: 'select',
      options: [
        { value: 'electrique', label: 'Électrique' },
        { value: 'mecanique', label: 'Mécanique' },
      ],
    },
    { key: 'range_km', label: 'Autonomie', type: 'number', unit: 'km' },
    { key: 'max_speed', label: 'Vitesse max', type: 'number', unit: 'km/h' },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
  ],

  boiler: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Vaillant, Bosch...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    {
      key: 'boiler_type', label: 'Type', type: 'select',
      options: [
        { value: 'gaz', label: 'Gaz' },
        { value: 'fioul', label: 'Fioul' },
        { value: 'electrique', label: 'Électrique' },
        { value: 'bois', label: 'Bois' },
        { value: 'granules', label: 'Granulés' },
      ],
    },
    { key: 'power_kw', label: 'Puissance', type: 'number', unit: 'kW' },
    { key: 'is_condensing', label: 'Chaudière à condensation', type: 'boolean' },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
    { key: 'has_maintenance_contract', label: "Contrat d'entretien", type: 'boolean' },
  ],

  ac: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Daikin, Mitsubishi...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    {
      key: 'ac_type', label: 'Type', type: 'select',
      options: [
        { value: 'split', label: 'Split (monosplit)' },
        { value: 'multi-split', label: 'Multi-split' },
        { value: 'gainable', label: 'Gainable' },
        { value: 'mobile', label: 'Mobile' },
      ],
    },
    { key: 'power_kw', label: 'Puissance', type: 'number', unit: 'kW' },
    { key: 'refrigerant', label: 'Fluide frigorigène', type: 'text', placeholder: 'R32, R410A...' },
    { key: 'energy_class', label: 'Classe énergétique', type: 'energy_class', options: ENERGY_CLASS_OPTIONS },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
  ],

  heatpump: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Atlantic, Daikin...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    {
      key: 'hp_type', label: 'Type', type: 'select',
      options: [
        { value: 'air-air', label: 'Air/Air' },
        { value: 'air-eau', label: 'Air/Eau' },
        { value: 'geothermique', label: 'Géothermique' },
      ],
    },
    { key: 'power_kw', label: 'Puissance', type: 'number', unit: 'kW' },
    { key: 'cop', label: 'COP', type: 'number', placeholder: '3.5' },
    { key: 'energy_class', label: 'Classe énergétique', type: 'energy_class', options: ENERGY_CLASS_OPTIONS },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
  ],

  waterheater: [
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Thermor, Atlantic...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    {
      key: 'wh_type', label: 'Type', type: 'select',
      options: [
        { value: 'electrique', label: 'Électrique' },
        { value: 'gaz', label: 'Gaz' },
        { value: 'thermodynamique', label: 'Thermodynamique' },
        { value: 'solaire', label: 'Solaire' },
      ],
    },
    { key: 'capacity_l', label: 'Capacité', type: 'number', unit: 'L' },
    { key: 'power_kw', label: 'Puissance', type: 'number', unit: 'kW' },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
  ],

  energy: [
    {
      key: 'energy_type', label: "Type d'équipement", type: 'select',
      options: [
        { value: 'panneau-solaire', label: 'Panneau solaire' },
        { value: 'batterie-stockage', label: 'Batterie de stockage' },
        { value: 'compteur-elec', label: 'Compteur électrique' },
        { value: 'compteur-gaz', label: 'Compteur gaz' },
        { value: 'borne-recharge', label: 'Borne de recharge (IRVE)' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Enphase, SolarEdge...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    { key: 'power_kw', label: 'Puissance', type: 'number', unit: 'kW' },
    { key: 'capacity_kwh', label: 'Capacité', type: 'number', unit: 'kWh' },
    { key: 'annual_production_kwh', label: 'Production annuelle estimée', type: 'number', unit: 'kWh' },
    { key: 'provider', label: 'Fournisseur / Contrat', type: 'text', placeholder: 'EDF, Engie...' },
    { key: 'contract_number', label: 'Numéro de contrat', type: 'text' },
    { key: 'serial_number', label: 'Numéro de série / PDL', type: 'text' },
  ],

  pool: [
    {
      key: 'pool_type', label: 'Type', type: 'select',
      options: [
        { value: 'enterree', label: 'Enterrée' },
        { value: 'semi-enterree', label: 'Semi-enterrée' },
        { value: 'hors-sol', label: 'Hors-sol' },
      ],
    },
    { key: 'length_m', label: 'Longueur', type: 'number', unit: 'm' },
    { key: 'width_m', label: 'Largeur', type: 'number', unit: 'm' },
    { key: 'depth_m', label: 'Profondeur', type: 'number', unit: 'm' },
    { key: 'volume_m3', label: 'Volume', type: 'number', unit: 'm³' },
    {
      key: 'material', label: 'Matériau', type: 'select',
      options: [
        { value: 'beton', label: 'Béton' },
        { value: 'liner', label: 'Liner' },
        { value: 'coque', label: 'Coque polyester' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'filtration_type', label: 'Type de filtration', type: 'text', placeholder: 'Sable, cartouche...' },
    { key: 'has_heating', label: 'Chauffage', type: 'boolean' },
    { key: 'heating_type', label: 'Type de chauffage', type: 'text', placeholder: 'Pompe à chaleur, solaire...' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
  ],

  appliance: [
    {
      key: 'sub_category', label: "Type d'appareil", type: 'select',
      options: [
        { value: 'refrigerateur', label: 'Réfrigérateur' },
        { value: 'lave-linge', label: 'Lave-linge' },
        { value: 'lave-vaisselle', label: 'Lave-vaisselle' },
        { value: 'four', label: 'Four' },
        { value: 'micro-ondes', label: 'Micro-ondes' },
        { value: 'hotte', label: 'Hotte' },
        { value: 'congelateur', label: 'Congélateur' },
        { value: 'seche-linge', label: 'Sèche-linge' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Bosch, Samsung...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'purchase_year', label: "Année d'achat", type: 'number' },
    { key: 'energy_class', label: 'Classe énergétique', type: 'energy_class', options: ENERGY_CLASS_OPTIONS },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
    { key: 'capacity', label: 'Capacité', type: 'text', placeholder: '7 kg, 250 L...' },
  ],

  garden: [
    {
      key: 'sub_category', label: 'Type de matériel', type: 'select',
      options: [
        { value: 'tondeuse', label: 'Tondeuse' },
        { value: 'robot-tondeuse', label: 'Robot tondeuse' },
        { value: 'taille-haie', label: 'Taille-haie' },
        { value: 'tronconneuse', label: 'Tronçonneuse' },
        { value: 'arrosage', label: "Système d'arrosage" },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Husqvarna, Bosch...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'purchase_year', label: "Année d'achat", type: 'number' },
    {
      key: 'motor_type', label: 'Motorisation', type: 'select',
      options: [
        { value: 'electrique', label: 'Électrique (filaire)' },
        { value: 'batterie', label: 'Batterie' },
        { value: 'thermique', label: 'Thermique' },
        { value: 'manuel', label: 'Manuel' },
      ],
    },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
  ],

  multimedia: [
    {
      key: 'sub_category', label: "Type d'appareil", type: 'select',
      options: [
        { value: 'television', label: 'Télévision' },
        { value: 'ordinateur-portable', label: 'Ordinateur portable' },
        { value: 'ordinateur-fixe', label: 'Ordinateur fixe' },
        { value: 'tablette', label: 'Tablette' },
        { value: 'smartphone', label: 'Smartphone' },
        { value: 'console', label: 'Console de jeux' },
        { value: 'enceinte', label: 'Enceinte / Barre de son' },
        { value: 'projecteur', label: 'Projecteur' },
        { value: 'appareil-photo', label: 'Appareil photo / Caméra' },
        { value: 'nas', label: 'NAS / Stockage réseau' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Samsung, Apple, Sony...' },
    { key: 'model', label: 'Modèle', type: 'text', placeholder: 'iPhone 15, PS5...' },
    { key: 'purchase_year', label: "Année d'achat", type: 'number' },
    { key: 'serial_number', label: 'Numéro de série / IMEI', type: 'text' },
    {
      key: 'os', label: "Système d'exploitation", type: 'select',
      options: [
        { value: 'windows', label: 'Windows' },
        { value: 'macos', label: 'macOS' },
        { value: 'ios', label: 'iOS / iPadOS' },
        { value: 'android', label: 'Android' },
        { value: 'linux', label: 'Linux' },
        { value: 'autre', label: 'Autre / N/A' },
      ],
    },
    { key: 'storage_gb', label: 'Stockage', type: 'number', unit: 'Go' },
    { key: 'ram_gb', label: 'RAM', type: 'number', unit: 'Go' },
    { key: 'screen_size', label: 'Taille écran', type: 'number', unit: '"' },
    { key: 'resolution', label: 'Résolution', type: 'text', placeholder: '4K, 1080p, 1440p...' },
    { key: 'warranty_end_date', label: 'Fin de garantie', type: 'date' },
    { key: 'has_extended_warranty', label: 'Garantie étendue', type: 'boolean' },
  ],

  security: [
    {
      key: 'security_type', label: "Type d'équipement", type: 'select',
      options: [
        { value: 'alarme', label: 'Alarme' },
        { value: 'camera', label: 'Caméra' },
        { value: 'interphone', label: 'Interphone / Visiophone' },
        { value: 'serrure-connectee', label: 'Serrure connectée' },
        { value: 'coffre-fort', label: 'Coffre-fort' },
        { value: 'detecteur', label: 'Détecteur (fumée, CO...)' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'brand', label: 'Marque', type: 'text', placeholder: 'Somfy, Ajax...' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'install_year', label: "Année d'installation", type: 'number' },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
    { key: 'has_monitoring_contract', label: 'Contrat télésurveillance', type: 'boolean' },
    { key: 'monitoring_provider', label: 'Prestataire', type: 'text', placeholder: 'Verisure, Securitas...' },
    { key: 'zone_code', label: 'Code zone', type: 'text', placeholder: 'Stocké localement' },
  ],

  pet: [
    {
      key: 'sub_category', label: "Type d'animal", type: 'select',
      options: [
        { value: 'chien', label: 'Chien' },
        { value: 'chat', label: 'Chat' },
        { value: 'oiseau', label: 'Oiseau' },
        { value: 'rongeur', label: 'Rongeur' },
        { value: 'reptile', label: 'Reptile' },
        { value: 'poisson', label: 'Poisson' },
        { value: 'autre', label: 'Autre' },
      ],
    },
    { key: 'race', label: 'Race', type: 'text', placeholder: 'Labrador, Siamois...' },
    { key: 'birth_date', label: 'Date de naissance', type: 'date' },
    {
      key: 'sex', label: 'Sexe', type: 'select',
      options: [
        { value: 'male', label: 'Mâle' },
        { value: 'femelle', label: 'Femelle' },
      ],
    },
    { key: 'chip_number', label: 'Numéro de puce', type: 'text', placeholder: '250268...' },
    { key: 'is_sterilized', label: 'Stérilisé(e)', type: 'boolean' },
    { key: 'blood_group', label: 'Groupe sanguin', type: 'text', placeholder: 'DEA 1.1+...' },
    { key: 'vet_name', label: 'Vétérinaire', type: 'text', placeholder: 'Dr. Martin...' },
    { key: 'has_insurance', label: 'Assurance santé', type: 'boolean' },
  ],

  other: [
    { key: 'brand', label: 'Marque', type: 'text' },
    { key: 'model', label: 'Modèle', type: 'text' },
    { key: 'serial_number', label: 'Numéro de série', type: 'text' },
    { key: 'purchase_year', label: "Année d'achat", type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
};