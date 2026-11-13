const NEGARA = [
  'Amerika Serikat', 'Inggris', 'Rusia', 'Ukraina', 'Jerman', 'Prancis', 'Tiongkok', 'Cina',
  'Korea Selatan', 'Korea Utara', 'Korea', 'Jepang', 'Indonesia', 'Brasil', 'Kanada', 'Meksiko',
  'Polandia', 'Italia', 'Belanda', 'Turki', 'Iran', 'Israel', 'Swiss', 'Swedia', 'Norwegia',
  'Finlandia', 'Denmark', 'Spanyol', 'Portugal', 'Yunani', 'Austria', 'Belgia', 'Hungaria',
  'Ceko', 'Belarus', 'Rumania', 'Bulgaria', 'Slowakia', 'Slovenia', 'Kroasia', 'Serbia', 'Kosovo',
  'Albania', 'Montenegro', 'Makedonia Utara', 'Bosnia dan Herzegovina', 'Moldova', 'Georgia',
  'Armenia', 'Azerbaijan', 'Estonia', 'Latvia', 'Lithuania', 'Lituania', 'Islandia', 'Irlandia',
  'Luksemburg', 'Malta', 'Monako', 'Siprus', 'Singapura', 'Malaysia', 'Filipina', 'Thailand',
  'Vietnam', 'Laos', 'Kamboja', 'Myanmar', 'Brunei Darussalam', 'Timor Leste', 'India', 'Pakistan',
  'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maladewa', 'Afghanistan', 'Kazakhstan',
  'Uzbekistan', 'Turkmenistan', 'Tajikistan', 'Kirgistan', 'Mongolia', 'Taiwan', 'Hong Kong',
  'Makau', 'Australia', 'Selandia Baru', 'Papua Nugini', 'Fiji', 'Samoa', 'Tonga', 'Palau',
  'Vanuatu', 'Kepulauan Solomon', 'Mesir', 'Libya', 'Tunisia', 'Aljazair', 'Maroko', 'Sudan',
  'Sudan Selatan', 'Etiopia', 'Eritrea', 'Somalia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda',
  'Burundi', 'Kongo', 'Republik Demokratik Kongo', 'Angola', 'Zambia', 'Zimbabwe', 'Mozambik',
  'Malawi', 'Botswana', 'Namibia', 'Afrika Selatan', 'Madagaskar', 'Mauritius', 'Seychelles',
  'Nigeria', 'Ghana', 'Senegal', 'Mali', 'Niger', 'Chad', 'Kamerun', 'Gabon', 'Pantai Gading',
  'Liberia', 'Sierra Leone', 'Guinea', 'Burkina Faso', 'Mauritania', 'Djibouti', 'Arab Saudi',
  'Uni Emirat Arab', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Yaman', 'Yordania', 'Irak', 'Suriah',
  'Libanon', 'Lebanon', 'Palestina', 'Argentina', 'Kolombia', 'Chili', 'Peru', 'Venezuela',
  'Ekuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname', 'Kuba', 'Haiti',
  'Republik Dominika', 'Jamaika', 'Bahama', 'Trinidad dan Tobago', 'Guatemala', 'Honduras',
  'El Salvador', 'Nikaragua', 'Kosta Rika', 'Panama', 'Puerto Riko', 'Greenland',
];

const LOKASI = [
  'Washington', 'Moskow', 'Kyiv', 'Kiev', 'London', 'Berlin', 'Paris', 'Beijing', 'Tokyo', 'Seoul',
  'Pyongyang', 'Jakarta', 'Den Haag', 'Brussels', 'Brussel', 'Jenewa', 'München', 'Wina', 'Roma',
  'Madrid', 'Ankara', 'Teheran', 'Tehran', 'Baghdad', 'Damaskus', 'Riyadh', 'Doha', 'Islamabad',
  'New Delhi', 'Canberra', 'Ottawa', 'Havana', 'Caracas', 'Bogotá', 'Bogota', 'Brasília', 'Brasilia',
  'Buenos Aires', 'Mexico City', 'Plesetsk', 'Kamchatka', 'Iqaluit', 'Chiapas', 'Guantanamo',
  'Diego Garcia', 'Okinawa', 'Kadena', 'Ramstein', 'Crimea', 'Krimea', 'Donbas', 'Luhansk',
  'Donetsk', 'Siberia', 'Sakhalin', 'Odesa', 'Kharkiv', 'Kherson', 'New York', 'Los Angeles',
  'San Francisco', 'San Diego', 'Chicago', 'Houston', 'Dallas', 'Austin', 'Miami', 'Boston',
  'Philadelphia', 'Seattle', 'Atlanta', 'Denver', 'Detroit', 'Las Vegas', 'Phoenix', 'Portland',
  'Minneapolis', 'Memphis', 'Nashville', 'Baltimore', 'Norfolk', 'Fort Bragg', 'Fort Sill', 'Guam',
  'Hawaii', 'Pearl Harbor', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia', 'Amerika Utara', 'Amerika Tengah',
  'Amerika Selatan', 'Amerika Latin', 'Eropa Timur', 'Eropa Barat', 'Asia Tenggara', 'Asia Timur',
  'Asia Tengah', 'Asia Selatan', 'Afrika Utara', 'Afrika Barat', 'Afrika Timur', 'Afrika Tengah',
  'Oseania', 'Eurasia', 'Skandinavia', 'Balkan', 'Baltik', 'Kaukasus', 'Karibia', 'Timur Tengah',
  'Timur Jauh', 'Jalur Gaza', 'Gaza', 'Tepi Barat', 'Dataran Tinggi Golan', 'Arktik', 'Antartika',
  'Atlantik', 'Pasifik', 'Pasifik Barat', 'Pasifik Timur', 'Pasifik Selatan', 'Indo-Pasifik',
  'Kawasan Indo-Pasifik', 'Amazon', 'Mediterania', 'Laut Hitam', 'Laut Merah', 'Laut Tengah',
  'Laut Arab', 'Laut Karibia', 'Laut Baltik', 'Laut Utara', 'Laut Natuna', 'Laut Cina Selatan',
  'Laut Tiongkok Selatan', 'Laut China Selatan', 'Laut Jepang', 'Laut Kaspia', 'Laut Filipina',
  'Laut Okhotsk', 'Laut Barents', 'Selat Taiwan', 'Selat Malaka', 'Selat Hormuz', 'Selat Bering',
  'Selat Gibraltar', 'Terusan Suez', 'Terusan Panama', 'Teluk Persia', 'Teluk Aden', 'Teluk Meksiko',
  'Pulau Kharg', 'Samudra Hindia', 'Samudra Arktik', 'Samudra Atlantik', 'Samudra Pasifik',
  'Samudra Pasifik Timur', 'Semenanjung Korea', 'Semenanjung Krimea', 'Semenanjung Arab',
  'Zona Demiliterisasi', 'Waskita',
];

const LEMBAGA = [
  'Gedung Putih', 'Pentagon', 'Kongres', 'Senat', 'Kapitol', 'Capitol Hill', 'Mahkamah Agung',
  'Wall Street', 'Departemen Perang', 'Departemen Pertahanan', 'Departemen Luar Negeri',
  'Departemen Keuangan', 'Departemen Kehakiman', 'Departemen Keamanan Dalam Negeri',
  'Departemen Energi', 'Departemen Perdagangan', 'Departemen Pertanian', 'Departemen Dalam Negeri',
  'Departemen Pendidikan', 'Departemen Transportasi', 'Departemen Tenaga Kerja',
  'Departemen Kesehatan dan Layanan Kemanusiaan', 'Angkatan Bersenjata', 'Angkatan Darat',
  'Angkatan Laut', 'Angkatan Udara', 'Angkatan Antariksa', 'Pasukan Antariksa', 'Korps Marinir',
  'Garda Nasional', 'Penjaga Pantai', 'Staf Gabungan', 'Kepala Staf Gabungan', 'Komando Pusat',
  'Komando Selatan', 'Komando Utara', 'Komando Eropa', 'Komando Indo-Pasifik', 'Komando Afrika',
  'Komando Operasi Khusus', 'Komando Siber', 'Dewan Keamanan Nasional', 'Dewan Keamanan PBB',
  'Dewan Keamanan', 'Majelis Umum PBB', 'Perserikatan Bangsa-Bangsa', 'Uni Eropa',
  'Komisi Eropa', 'Parlemen Eropa', 'Mahkamah Internasional', 'Mahkamah Pidana Internasional',
  'Bank Dunia', 'Dana Moneter Internasional', 'Organisasi Perdagangan Dunia',
  'Organisasi Kesehatan Dunia', 'Badan Energi Atom Internasional', 'Palang Merah Internasional',
  'Organisasi Perjanjian Atlantik Utara', 'Kementerian Pertahanan', 'Kementerian Luar Negeri',
  'Kementerian Keuangan', 'Dewan Perwakilan Rakyat', 'Majelis Permusyawaratan Rakyat',
  'Tentara Nasional Indonesia', 'Partai Demokrat', 'Partai Republik', 'Demokrat', 'Republikan',
  'Islam', 'Kristen', 'Katolik', 'Protestan', 'Yahudi', 'Hindu', 'Buddha', 'Konghucu', 'Ortodoks',
  'Vatikan', 'USS Gerald R. Ford', 'USS Abraham Lincoln', 'USS Nimitz', 'USS Carl Vinson',
  'USS George Washington', 'Operation Epic Fury', 'Operation Southern Spear', 'Project Freedom',
  'Cobra Gold', 'Valiant Shield', 'Freedom Shield', 'Ulchi Freedom Shield', 'Golden Dome',
  'Perang Dunia I', 'Perang Dunia II', 'Perang Dingin', 'Perang Teluk', 'Perang Korea',
  'Perang Vietnam', 'Piala Dunia', 'Olimpiade', 'Natal', 'Paskah', 'Ramadan', 'Idulfitri',
  'Tahun Baru', 'Hari Kemerdekaan',
];

const TOKOH = [
  'Donald Trump', 'Vladimir Putin', 'Volodymyr Zelenskyy', 'Emmanuel Macron', 'Olaf Scholz',
  'Friedrich Merz', 'Keir Starmer', 'Joe Biden', 'Xi Jinping', 'Kim Jong Un', 'Claudia Sheinbaum',
  'Giorgia Meloni', 'Mark Carney', 'Justin Trudeau', 'Bill Blair', 'John Healey', 'Andrei Belousov',
  'Rustem Umerov', 'Władysław Kosiniak-Kamysz', 'Tomás Ribeiro Paiva', 'Gregory M. Guillot',
  'Caspar Veldkamp', 'Boris Pistorius', 'Alexus Grynkewich', 'Christopher C. Laneve',
  'Stephen Whiting', 'Gutri Rahmad Zuwa', 'Budi Santoso', 'Joko Widodo', 'Prabowo Subianto',
  'Susilo Bambang Yudhoyono', 'Megawati Soekarnoputri', 'Anies Baswedan', 'Ganjar Pranowo',
  'Sjafrie Sjamsoeddin', 'Alexander Lukashenko', 'Recep Tayyip Erdoğan', 'Benjamin Netanyahu',
  'Narendra Modi', 'Fumio Kishida', 'Ahn Gyu-back', 'Lee Jae-myung', 'Nicolás Maduro',
  'Ali Larijani', 'Masoud Pezeshkian', 'Pete Hegseth', 'Marco Rubio', 'JD Vance', 'Dan Caine',
  'Emil Michael', 'Zohran Mamdani', 'Robert F. Kennedy Jr.', 'Jeffrey Epstein', 'Thomas Massie',
  'Lindsey Graham', 'Joe Kent', 'Karoline Leavitt', 'Tulsi Gabbard', 'Pam Bondi', 'Scott Bessent',
  'Howard Lutnick', 'Gavin Newsom', 'Chuck Schumer', 'Mike Johnson', 'John Thune', 'Hakeem Jeffries',
  'Elon Musk',
];

const AKRONIM = [
  'AS', 'PBB', 'NATO', 'UE', 'DPR', 'DPD', 'MPR', 'TNI', 'FBI', 'CIA', 'NSA', 'DHS', 'ICE', 'CBP',
  'CDC', 'FDA', 'NIH', 'EPA', 'NASA', 'OPEC', 'IMF', 'WTO', 'AI', 'UAV', 'UAS', 'C-UAS', 'JIATF',
  'CENTCOM', 'EUCOM', 'INDOPACOM', 'SOUTHCOM', 'NORTHCOM', 'AFRICOM', 'USSOCOM', 'SPACECOM',
  'NDAA', 'USS', 'USNS', 'KTT', 'OSINT', 'RRI', 'BBC', 'CNN', 'AFP', 'GPS', 'ICBM', 'THAAD',
  'HIMARS', 'RIMPAC', 'FY', 'KDIC', 'POLRI', 'AD', 'AL', 'AU', 'BHI', 'LK', 'ASEAN', 'BRICS',
  'G7', 'G20', 'IAEA', 'WHO', 'BMKG', 'BAIS', 'BIN', 'BSSN', 'MoU',
];

const JABATAN = [
  'Presiden Terpilih', 'Wakil Perdana Menteri', 'Wakil Presiden', 'Perdana Menteri',
  'Menteri Pertahanan', 'Menteri Luar Negeri', 'Menteri Keuangan', 'Menteri Perang',
  'Menteri Keamanan Dalam Negeri', 'Menteri Kehakiman', 'Wakil Menteri', 'Direktur Intelijen Nasional',
  'Penasihat Keamanan Nasional', 'Ketua Kepala Staf Gabungan', 'Kepala Staf Angkatan Darat',
  'Kepala Staf Angkatan Laut', 'Kepala Staf Angkatan Udara', 'Letnan Jenderal',
  'Mayor Jenderal', 'Brigadir Jenderal', 'Laksamana Muda', 'Letnan Kolonel',
  'Presiden', 'Menteri', 'Kanselir', 'Raja', 'Ratu', 'Pangeran', 'Kaisar', 'Emir', 'Syekh',
  'Paus', 'Gubernur', 'Wali Kota', 'Bupati', 'Senator', 'Jaksa Agung', 'Hakim Agung', 'Hakim',
  'Duta Besar', 'Utusan Khusus', 'Juru Bicara', 'Sekretaris Pers', 'Sekretaris', 'Direktur',
  'Ketua', 'Kepala Staf', 'Kepala', 'Komandan', 'Panglima', 'Jenderal', 'Laksamana', 'Marsekal',
  'Kolonel', 'Letkol', 'Mayor', 'Kapten', 'Letnan', 'Sersan', 'Kopral', 'Profesor', 'Dokter',
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ENTITAS_BAWAAN = [...NEGARA, ...LOKASI, ...LEMBAGA, ...TOKOH,
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus',
  'September', 'Oktober', 'November', 'Desember', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_TANGGAL = 'Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember';
const ENTITAS_BAWAAN_MAP = new Map(
  ENTITAS_BAWAAN.map((entity) => [entity.toLocaleLowerCase('id-ID'), entity])
);
const ENTITAS_BAWAAN_RE = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${[...ENTITAS_BAWAAN_MAP.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|')})(?![\\p{L}\\p{N}_])`,
  'giu'
);
const AKRONIM_RE = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${AKRONIM.map(escapeRegex).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}\\p{N}_])`,
  'giu'
);
const JABATAN_SET = new Set(JABATAN.map((title) => title.toLocaleLowerCase('id-ID')));
const MAX_JABATAN_WORDS = Math.max(...JABATAN.map((title) => title.split(/\s+/).length));
const TOKOH_SET = new Set(TOKOH.map((name) => name.toLocaleLowerCase('id-ID')));
const smallNameWords = new Set(['bin', 'binti', 'van', 'von', 'de', 'da', 'al', 'el', 'dan']);
const ADDITIONAL_MATCHER_CACHE = new Map<string, { entities: Map<string, string>; pattern: RegExp }>();

function toNameCase(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('id-ID')
    .split(/(\s+|-)/)
    .map((part, index) => {
      if (!part || /^\s+$|^-$/u.test(part)) return part;
      if (index > 0 && smallNameWords.has(part)) return part;
      return part.charAt(0).toLocaleUpperCase('id-ID') + part.slice(1);
    })
    .join('');
}

function capitalizeTitles(text: string, additionalPeople: string[] = []): string {
  const tokens = [...text.matchAll(/\S+/g)].map((match) => ({
    value: match[0],
    index: match.index ?? 0,
  }));
  const positions = text.split('');
  const tokenWord = (value: string) => value.replace(/^[^\p{L}]+|[^\p{L}.'’-]+$/gu, '');
  const firstLetter = (token: number) =>
    tokens[token].index + (tokens[token].value.length - tokens[token].value.replace(/^[^\p{L}]+/u, '').length);
  const people = new Set(
    [...TOKOH_SET, ...additionalPeople]
      .flatMap((entity) => entity.split(/[;,\n]/))
      .map((entity) => toNameCase(entity).toLocaleLowerCase('id-ID'))
      .filter((entity) => entity.length > 1)
  );
  const personStarts = new Set<number>();

  for (let start = 0; start < tokens.length; start++) {
    let phrase = '';
    for (let end = start; end < tokens.length && end < start + 7; end++) {
      if (end > start && /[,.;:]$/.test(tokens[end - 1].value)) break;
      const word = tokenWord(tokens[end].value);
      if (!word) break;
      phrase = `${phrase} ${word}`.trim().toLocaleLowerCase('id-ID');
      if (people.has(phrase)) personStarts.add(start);
    }
  }

  const nextPersonInSentence = new Array<number>(tokens.length).fill(-1);
  let nextPerson = -1;
  for (let index = tokens.length - 1; index >= 0; index--) {
    if (personStarts.has(index)) nextPerson = index;
    nextPersonInSentence[index] = nextPerson;
    if (/[,.;:]$/.test(tokens[index].value)) nextPerson = -1;
  }

  for (let start = tokens.length - 1; start >= 0; start--) {
    for (let count = Math.min(MAX_JABATAN_WORDS, tokens.length - start); count >= 1; count--) {
      const segment = tokens.slice(start, start + count);
      if (segment.slice(0, -1).some((token) => /[,.;:]$/.test(token.value))) continue;
      const title = segment.map((token) => tokenWord(token.value).toLocaleLowerCase('id-ID')).join(' ');
      if (!JABATAN_SET.has(title)) continue;

      const personSearchStart = start + count;
      const foundPerson =
        personSearchStart < tokens.length && nextPersonInSentence[personSearchStart] !== -1;

      if (foundPerson) {
        for (let index = start; index < start + count; index++) {
          positions[firstLetter(index)] = positions[firstLetter(index)].toLocaleUpperCase('id-ID');
        }
      }
      break;
    }
  }
  return positions.join('');
}

export function entitasDariRekaman(record: { tokoh?: string; negara?: string }): string[] {
  return [...(record.tokoh ?? '').split(/[;,\n]/), record.negara ?? '']
    .map((entity) => entity.trim())
    .filter((entity) => entity.length > 1)
    .map(toNameCase);
}

export function teksSemuaKapital(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.length > 5 && letters === letters.toLocaleUpperCase('id-ID');
}

export function perbaikiEyd(
  text: string,
  entitasTambahan: string[] = [],
  kapitalAwalKalimat = true,
  entitasTokoh: string[] = []
): string {
  let result = text.replace(/\s+/g, ' ').trim();
  result = result.replace(
    ENTITAS_BAWAAN_RE,
    (match) => ENTITAS_BAWAAN_MAP.get(match.toLocaleLowerCase('id-ID')) ?? match
  );
  const additionalEntries = new Map<string, string>();
  for (const entity of entitasTambahan) {
    const value = entity.trim();
    if (value) {
      const key = value.toLocaleLowerCase('id-ID');
      if (ENTITAS_BAWAAN_MAP.get(key) !== value) additionalEntries.set(key, value);
    }
  }
  if (additionalEntries.size > 0) {
    const cacheKey = [...additionalEntries.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\u0001');
    let matcher = ADDITIONAL_MATCHER_CACHE.get(cacheKey);
    if (!matcher) {
      const entities = new Map(additionalEntries);
      const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}_])(${[...entities.keys()]
          .sort((a, b) => b.length - a.length)
          .map(escapeRegex)
          .join('|')})(?![\\p{L}\\p{N}_])`,
        'giu'
      );
      matcher = { entities, pattern };
      if (ADDITIONAL_MATCHER_CACHE.size >= 256) {
        const oldestKey = ADDITIONAL_MATCHER_CACHE.keys().next().value;
        if (oldestKey) ADDITIONAL_MATCHER_CACHE.delete(oldestKey);
      }
      ADDITIONAL_MATCHER_CACHE.set(cacheKey, matcher);
    }
    result = result.replace(
      matcher.pattern,
      (match) => matcher.entities.get(match.toLocaleLowerCase('id-ID')) ?? match
    );
  }

  result = result.replace(AKRONIM_RE, (match) => match.toLocaleUpperCase('id-ID'));
  result = result.replace(
    /(?<![\p{L}\p{N}])([a-z]{1,3})-(\d{1,3}[a-z]?)(?![\p{L}\p{N}])/giu,
    (_match, prefix: string, suffix: string) => `${prefix.toUpperCase()}-${suffix.toUpperCase()}`
  );
  result = result.replace(/\bhari\s+minggu\b/giu, (match) => match.replace(/minggu$/i, 'Minggu'));
  result = result.replace(new RegExp(`\\bminggu(?=\\s+\\d{1,2}\\s+(?:${HARI_TANGGAL})\\b)`, 'giu'), 'Minggu');
  result = capitalizeTitles(result, entitasTokoh);

  const sentenceStart = kapitalAwalKalimat ? '(^|[.!?]\\s+)' : '([.!?]\\s+)';
  return result.replace(
    new RegExp(`${sentenceStart}(\\p{Ll})`, 'gu'),
    (match, prefix: string, initial: string, offset: number, fullText: string) => {
      const before = fullText.slice(0, offset).trimEnd();
      if (/[.!?]/.test(prefix) && /(?:^|[\s])\p{L}$/u.test(before)) return match;
      return prefix + initial.toLocaleUpperCase('id-ID');
    }
  );
}
