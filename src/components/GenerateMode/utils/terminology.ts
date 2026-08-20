// Terminology mapping based on the provided table
export const terminologyMap: Record<string, Record<string, string>> = {
  // Portuguese corrections
  'pt': {
    'sutiã': 'soutien',
    'sutiãs': 'soutiens', 
    'cueca': 'cuecas',
    'calcinha': 'cuecas',
    'calcinhas': 'cuecas',
    'abordagem fresca': 'abordagem contemporânea',
    'abordagem nova': 'abordagem contemporânea',
    // Sleepwear & Lingerie specific terms (Carolina's corrections)
    'Roupa de dormir': 'roupa de dormir',
    'camisa de noite': 'camisa de dormir',
    'shorts': 'calções',
    'top sem mangas': 'top',
    'comprimento total': 'comprido',
    'jersey de algodão': 'malha de algodão',
    'bordas delicadas': 'rebordos delicados',
    'Forro suave ao contacto com a pele': 'Forro suave',
    'forro suave ao contacto com a pele': 'forro suave',
    'soutien almofadado': 'soutien com copas',
    'soutien não-almofadado': 'soutien não almofadado',
    'borda interior do copo': 'borda interior da copa',
    'copo': 'copa',
    'copos': 'copas',
  },
  
  // German
  'de': {
    'shaping shorts': 'Figurformende Shorts',
    'pyjama top': 'Pyjama-Oberteil',
    'shirt': 'Hemd',
    'dirndl': 'Dirndl-BH',
    'non-wired padded bra': 'Bügelloser, gepolsterter BH',
    'robe top': 'Morgenmantel-Oberteil',
    'bandeau bikini top': 'Bandeau Bikini Top',
    'bandeau bra': 'Bandeau BH',
    'bandeau knickers': 'Bandeau-Slip',
    'bandeau swimsuit': 'Bandeau Badeanzug',
    'bikini top with removable pads': 'Bikinioberteil mit herausnehmbaren Pads',
    'body': 'Body',
    'bolero': 'Bolero-Shirt',
    'bralette': 'Bralette',
    'bra-top': 'BH-Top',
    'brazilian bikini bottoms': 'Bikini Brazilian',
    'brazilian knickers': 'Brazilian',
    'cardigan': 'Strickjacke',
    'corset': 'Korsage',
    'dress': 'Kleid',
    'face mask': 'Gesichtsmaske',
    'highleg bikini bottoms': 'Bikini Slip mit hohem Beinausschnitt',
    'highleg knickers': 'Slip mit hohem Beinausschnitt',
    'highwaist bikini bottoms': 'Bikini Highwaist',
    'highwaist knickers': 'High Waist Slip',
    'highwaist shaping knickers': 'Shapewear Taillenslip',
    'hipster bikini bottoms': 'Bikini Hipster',
    'hipster knickers': 'Hipster',
    'hood': 'Kapuze',
    'hoodie': 'Hoodie',
    'jacket': 'Jacke',
    'leggings': 'Leggings',
    'long-sleeve top': 'Top mit langen Ärmeln',
    'maxi bikini bottoms': 'Bikini Maxi',
    'maxi knickers': 'Maxi',
    'men\'s hipster briefs': 'Herren Hipster',
    'men\'s maxi briefs': 'Herren Maxi',
    'men\'s midi briefs': 'Herren Midi',
    'men\'s mini briefs': 'Herren Mini',
    'men\'s shorts': 'Herren Short',
    'men\'s swim slip': 'Herren Badehose',
    'men\'s swimshorts': 'Herren Badeshorts',
    'men\'s tank top': 'Herren-Tanktop',
    'men\'s t-shirt': 'Herren-T-Shirt',
    'midi bikini bottoms': 'Bikini Midi',
    'midi knickers': 'Midi',
    'mini bikini bottoms': 'Bikini Mini',
    'mini knickers': 'Mini',
    'minimizer bra': 'Minimizer BH',
    'minimizer sports bra': 'Minimizer Sport BH',
    'nightdress': 'Nachthemd',
    'minimizer bikini top': 'Minimizer-Bikinioberteil',
    'non-wired bra': 'BH ohne Bügel',
    'nursing bra': 'Still-BH',
    'non-wired bikini top': 'Bikini Top ohne Bügel',
    'padded bikini top': 'Bikini Top gefüttert',
    'padded bra': 'Gefütterter BH',
    'padded bra with detachable straps': 'Gefütterter BH mit abnehmbaren Trägern',
    'panty girdle': 'Miederhose',
    'pareo': 'Pareo',
    'period hipster knickers': 'Menstruations Hipster',
    'period short knickers': 'Menstruations Shorts',
    'period tai knickers': 'Menstruations Taillenslip',
    'playsuit': 'Playsuit',
    'padded bikini top with detachable straps': 'Bikini Top gefüttert mit abnehmbaren Trägern',
    'push-up bra': 'Push-up BH',
    'push-up bra with front closure': 'Push-up BH mit Frontverschluss',
    'pyjama set': 'Pyjama-Set',
    'robe': 'Bademantel',
    'shaping body': 'Shape-Body',
    'shaping body wired': 'Shape-Body mit Bügeln',
    'shaping bra': 'Formender BH',
    'shaping hipster knickers': 'Formende Hipster',
    'shaping maxi knickers': 'Formender Maxi Slip',
    'shaping string': 'Formender String',
    'shaping tai knickers': 'Formender Taillenslip',
    'shaping vest': 'Formendes Unterhemd',
    'short knickers': 'Shorty',
    'shorts': 'Shorts',
    'short-sleeve top': 'Kurzarm Top',
    'silicon straps': 'Silikon-Träger',
    'slip skirt': 'Unterrock',
    'slippers': 'Hausschuhe',
    'socks': 'Socken',
    'sports bra': 'Sport BH',
    'sports leggings': 'Sportleggings',
    'string': 'String',
    'swimsuit': 'Badeanzug',
    'swimsuit with padded cups': 'Badeanzug mit gefütterten Cups',
    'tanga': 'Tanga',
    'push-up bikini top': 'Push-up Bikini Top',
    'tai knickers': 'Tai',
    'tank top': 'Tanktop',
    'tankini': 'Tankini',
    'top with spaghetti straps': 'Unterhemd mit Spaghettiträgern',
    'trousers': 'Hose',
    't-shirt bra': 'T-Shirt-BH',
    'tunic': 'Tunika',
    'unisex leggings': 'Unisex Leggings',
    'unisex long-sleeve top': 'Unisex Langarm-Top',
    'unisex pants': 'Unisex-Hose',
    'unisex t-shirt': 'Unisex T-Shirt',
    'tai bikini bottoms': 'Bikini Tai',
    'wired bikini top': 'Bikini Top mit Bügel',
    'wired body': 'Body mit Bügeln',
    'wired bra': 'Bügel-BH',
    'wired bra with detachable straps': 'Bügel-BH mit abnehmbaren Trägern',
    'wired padded bra': 'Gefütterter Bügel-BH',
    'wired padded bra with detachable straps': 'Gefütterter Bügel-BH mit abnehmbaren Trägern',
    'wired swimsuit': 'Badeanzug mit Bügeln',
    'balconette bra': 'Balconette-BH',
    'bustier': 'Bustier',
    'romper': 'Overall',
    'scarf': 'Schal',
    'sweater': 'Pullover',
    'cyclist shorts': 'Radlerhose',
    'racer top': 'Racer-Top',
    't-shirt': 'T-Shirt',
    'bodies': 'Bodies',
    'top': 'Top',
    'soft bra': 'Soft bra',
    'ultra bra': 'Ultra bra',
    'beach towel': 'Strandtuch',
    'blindfold': 'Augenbinde',
    'cape': 'Umhang',
    'choker': 'Halsreif',
    'collar': 'Kragen',
    'garter belt': 'Strumpfgürtel',
    'harness': 'Harness',
    'jumpsuit': 'Jumpsuit',
    'kaftan': 'Kaftan',
    'kimono': 'Kimono',
    'nipple cover': 'Nipple Cover',
    'suspender': 'Strumpfhalter',
    'suspender belt': 'Strumpfgürtel',
    'wired bikini top with padded cups': 'Bikini Top gefüttert mit Bügel',
    'men\'s brief': 'Herren-Slips',
    'men\'s boxer shorts': 'Boxershorts',
    'men\'s socks': 'Herrensocken',
    'men\'s trunks': 'Trunks',
    'pyjama tops': 'Pyjama-Oberteile',
    'pyjama bottoms': 'Pyjama-Hosen',
    'pyjama sets': 'Pyjama-Sets',
    'tops': 'Tops',
    'sweaters/hoodies': 'Pullover/Hoodies',
    'bottoms': 'Hosen',
    'loungewear sets': 'Loungewear-Sets'
  },

  // Spanish
  'es': {
    'shaping shorts': 'Shorts moldeadores',
    'pyjama top': 'Camiseta de pijama',
    'shirt': 'Camiseta',
    'dirndl': 'Sujetador dirndl',
    'non-wired padded bra': 'Sujetador sin aros, acolchado',
    'robe top': 'Camiseta de bata',
    'bandeau bikini top': 'Top bikini bandeau',
    'bandeau bra': 'Sujetador bandeau',
    'bandeau knickers': 'Braguita bandeau',
    'bandeau swimsuit': 'Bañador bandeau',
    'bikini top with removable pads': 'Top bikini con copas extraíbles',
    'body': 'Body',
    'bolero': 'Bolero',
    'bralette': 'Bralette',
    'bra-top': 'Bra-top',
    'brazilian bikini bottoms': 'Braguita bikini brasileña',
    'brazilian knickers': 'Braguita brasileña',
    'cardigan': 'Cárdigan',
    'corset': 'Corsé',
    'dress': 'Vestido',
    'face mask': 'Mascarilla',
    'highleg bikini bottoms': 'Bikini tiro alto',
    'highleg knickers': 'Braguita tiro alto',
    'highwaist bikini bottoms': 'Bikini talle alto',
    'highwaist knickers': 'Braguita cintura alta',
    'highwaist shaping knickers': 'Braguita alta moldeadora',
    'hipster bikini bottoms': 'Braguita bikini hipster',
    'hipster knickers': 'Hipster',
    'hood': 'Capucha',
    'hoodie': 'Sudadera con capucha',
    'jacket': 'Chaqueta',
    'leggings': 'Leggings',
    'long-sleeve top': 'Top manga larga',
    'maxi bikini bottoms': 'Braguita bikini maxi',
    'maxi knickers': 'Braguita maxi',
    'men\'s hipster briefs': 'Calzoncillos hipster',
    'men\'s maxi briefs': 'Calzoncillos maxi',
    'men\'s midi briefs': 'Calzoncillos midi',
    'men\'s mini briefs': 'Calzoncillos mini',
    'men\'s shorts': 'Calzoncillos shorts',
    'men\'s swim slip': 'Bañador slip hombre',
    'men\'s swimshorts': 'Bañador shorts hombre',
    'men\'s tank top': 'Camiseta tirantes hombre',
    'men\'s t-shirt': 'Camiseta hombre',
    'midi bikini bottoms': 'Braguita bikini midi',
    'midi knickers': 'Braguita midi',
    'mini bikini bottoms': 'Braguita bikini mini',
    'mini knickers': 'Braguita mini',
    'minimizer bra': 'Sujetador reductor',
    'minimizer sports bra': 'Sujetador deportivo reductor',
    'nightdress': 'Camisón',
    'minimizer bikini top': 'Top bikini reductor',
    'non-wired bra': 'Sujetador sin aros',
    'nursing bra': 'Sujetador lactancia',
    'non-wired bikini top': 'Top bikini sin aros',
    'padded bikini top': 'Top bikini acolchado',
    'padded bra': 'Sujetador con copas',
    'padded bra with detachable straps': 'Sujetador con copas y tirantes desmontables',
    'panty girdle': 'Faja panty',
    'pareo': 'Pareo',
    'period hipster knickers': 'Braguitas hipster menstruales',
    'period short knickers': 'Braguitas short menstruales',
    'period tai knickers': 'Braguitas tai menstruales',
    'playsuit': 'Mono casual',
    'padded bikini top with detachable straps': 'Top bikini acolchado con tirantes desmontables',
    'push-up bra': 'Sujetador push-up',
    'push-up bra with front closure': 'Sujetador push-up con cierre frontal',
    'pyjama set': 'Conjunto pijama',
    'robe': 'Bata',
    'shaping body': 'Body moldeador',
    'shaping body wired': 'Body moldeador con aros',
    'shaping bra': 'Sujetador moldeador',
    'shaping hipster knickers': 'Hipster moldeador',
    'shaping maxi knickers': 'Maxi moldeadora',
    'shaping string': 'Tanga moldeadora',
    'shaping tai knickers': 'Tai moldeadora',
    'shaping vest': 'Camiseta moldeadora',
    'short knickers': 'Braguita short',
    'shorts': 'Pantalones cortos',
    'short-sleeve top': 'Top manga corta',
    'silicon straps': 'Tiras silicona',
    'slip skirt': 'Falda',
    'slippers': 'Zapatillas',
    'socks': 'Calcetines',
    'sports bra': 'Sujetador deportivo',
    'sports leggings': 'Leggings deportivos',
    'string': 'Tanga',
    'swimsuit': 'Bañador',
    'swimsuit with padded cups': 'Bañador con copas acolchadas',
    'tanga': 'Tanga',
    'push-up bikini top': 'Top bikini push-up',
    'tai knickers': 'Braguita tai',
    'tank top': 'Camiseta tirantes',
    'tankini': 'Tankini',
    'top with spaghetti straps': 'Top con tirantes finos',
    'trousers': 'Pantalones',
    't-shirt bra': 'Sujetador camiseta',
    'tunic': 'Túnica',
    'unisex leggings': 'Leggings unisex',
    'unisex long-sleeve top': 'Top unisex manga larga',
    'unisex pants': 'Pantalones unisex',
    'unisex t-shirt': 'Camiseta unisex',
    'tai bikini bottoms': 'Braguita bikini tai',
    'wired bikini top': 'Top bikini con aros',
    'wired body': 'Body con aros',
    'wired bra': 'Sujetador con aros',
    'wired bra with detachable straps': 'Sujetador con aros y tirantes desmontables',
    'wired padded bra': 'Sujetador con copas y aros',
    'wired padded bra with detachable straps': 'Sujetador con copas, aros y desmontable',
    'wired swimsuit': 'Bañador con aros',
    'balconette bra': 'Sujetador balconette',
    'bustier': 'Corsé',
    'romper': 'Mono',
    'scarf': 'Bufanda',
    'sweater': 'Suéter',
    'cyclist shorts': 'Pantalón ciclista',
    'racer top': 'Top cruzado',
    't-shirt': 'Camiseta',
    'bodies': 'Bodies',
    'top': 'Top',
    'soft bra': 'Soft bra',
    'ultra bra': 'Ultra bra',
    'beach towel': 'Serviette de plage',
    'blindfold': 'Bandeau',
    'cape': 'Cape',
    'choker': 'Ras-du-cou',
    'collar': 'Col',
    'garter belt': 'Ceinture porte-jarretelles',
    'harness': 'Modèle à liens',
    'jumpsuit': 'Mono',
    'kaftan': 'Caftan',
    'kimono': 'Kimono',
    'nipple cover': 'Cache-tétons',
    'suspender': 'Porte-jarretelles',
    'suspender belt': 'Ceinture porte-jarretelles',
    'wired bikini top with padded cups': 'Top bikini con aros y copas acolchadas',
    'men\'s brief': 'Calzoncillos',
    'men\'s boxer shorts': 'Calzoncillos short bóxer',
    'men\'s socks': 'Calcetines de hombre',
    'men\'s trunks': 'Calzoncillos Trunk de hombre',
    'pyjama tops': 'Camisetas de pijama',
    'pyjama bottoms': 'Pantalones de pijama',
    'pyjama sets': 'Conjuntos de pijama',
    'tops': 'Tops',
    'sweaters/hoodies': 'Sudaderas',
    'bottoms': 'Pantalones',
    'loungewear sets': 'Conjuntos Loungewear'
  },

  // Italian
  'it': {
    'shaping shorts': 'Short aderenti',
    'pyjama top': 'Giacca del pigiama',
    'shirt': 'Camicia',
    'dirndl': 'Reggiseno dirndl',
    'non-wired padded bra': 'Reggiseno imbottito senza ferretto',
    'robe top': 'Canotta',
    'bandeau bikini top': 'Top bikini bandeau',
    'bandeau bra': 'Reggiseno bandeau',
    'bandeau knickers': 'Slip bandeau',
    'bandeau swimsuit': 'Costume da bagno bandeau',
    'bikini top with removable pads': 'Top bikini con coppe rimovibili',
    'body': 'Body',
    'bolero': 'Bolero',
    'bralette': 'Bralette',
    'bra-top': 'Top con reggiseno',
    'brazilian bikini bottoms': 'Bikini brasiliano inferiore',
    'brazilian knickers': 'Brasiliano',
    'cardigan': 'Cardigan',
    'corset': 'Corsetto',
    'dress': 'Vestito',
    'face mask': 'Mascherina',
    'highleg bikini bottoms': 'Bikini con taglio alto inferiore',
    'highleg knickers': 'Culotte con taglio alto',
    'highwaist bikini bottoms': 'Bikini a vita alta inferiore',
    'highwaist knickers': 'Culotte a vita alta',
    'highwaist shaping knickers': 'Culotte modellante alta',
    'hipster bikini bottoms': 'Bikini hipster inferiore',
    'hipster knickers': 'Hipster',
    'hood': 'Cappuccio',
    'hoodie': 'Felpa con cappuccio',
    'jacket': 'Giacca',
    'leggings': 'Leggings',
    'long-sleeve top': 'Top a maniche lunghe',
    'maxi bikini bottoms': 'Bikini maxi inferiore',
    'maxi knickers': 'Culotte maxi',
    'men\'s hipster briefs': 'Hipster uomo',
    'men\'s maxi briefs': 'Maxi uomo',
    'men\'s midi briefs': 'Midi uomo',
    'men\'s mini briefs': 'Mini uomo',
    'men\'s shorts': 'Pantaloncini da uomo',
    'men\'s swim slip': 'Slip da bagno uomo',
    'men\'s swimshorts': 'Pantaloncini da mare uomo',
    'men\'s tank top': 'Canottiera da uomo',
    'men\'s t-shirt': 'T-shirt da uomo',
    'midi bikini bottoms': 'Bikini midi inferiore',
    'midi knickers': 'Culotte midi',
    'mini bikini bottoms': 'Bikini mini inferiore',
    'mini knickers': 'Culotte mini',
    'minimizer bra': 'Reggiseno riduttore',
    'minimizer sports bra': 'Reggiseno sportivo riduttore',
    'nightdress': 'Camicia da notte',
    'minimizer bikini top': 'Top bikini riduttore',
    'non-wired bra': 'Reggiseno senza ferretto',
    'nursing bra': 'Reggiseno per l\'allattamento',
    'non-wired bikini top': 'Top bikini senza ferretto',
    'padded bikini top': 'Top bikini imbottito',
    'padded bra': 'Reggiseno imbottito',
    'padded bra with detachable straps': 'Reggiseno imbottito con spalline staccabili',
    'panty girdle': 'Panty girdle',
    'pareo': 'Pareo',
    'period hipster knickers': 'Mutandine mestruale hipster',
    'period short knickers': 'Mutandine mestruale shorty',
    'period tai knickers': 'Mutandine mestruale tai',
    'playsuit': 'Playsuit',
    'padded bikini top with detachable straps': 'Top bikini imbottito con spalline staccabili',
    'push-up bra': 'Reggiseno push-up',
    'push-up bra with front closure': 'Reggiseno push-up con chiusura frontale',
    'pyjama set': 'Pigiama',
    'robe': 'Accappatoio',
    'shaping body': 'Body modellante',
    'shaping body wired': 'Body modellante con ferretto',
    'shaping bra': 'Reggiseno modellante',
    'shaping hipster knickers': 'Hipster modellante',
    'shaping maxi knickers': 'Culotte modellante maxi',
    'shaping string': 'Slip modellante',
    'shaping tai knickers': 'Culotte modellante tai',
    'shaping vest': 'Canotta modellante',
    'short knickers': 'Culotte corta',
    'shorts': 'Shorts',
    'short-sleeve top': 'Top a maniche corte',
    'silicon straps': 'Cinghie di silicone',
    'slip skirt': 'Gonna a tubo',
    'slippers': 'Pantofole',
    'socks': 'Calzini',
    'sports bra': 'Reggiseno sportivo',
    'sports leggings': 'Leggings sportivi',
    'string': 'Slip',
    'swimsuit': 'Costume da bagno',
    'swimsuit with padded cups': 'Costume da bagno con coppe imbottite',
    'tanga': 'Tanga',
    'push-up bikini top': 'Top bikini push-up',
    'tai knickers': 'Culotte tai',
    'tank top': 'Canottiera',
    'tankini': 'Tankini',
    'top with spaghetti straps': 'Top con spalline sottili',
    'trousers': 'Pantaloni',
    't-shirt bra': 'Reggiseno t-shirt',
    'tunic': 'Tunica',
    'unisex leggings': 'Leggings unisex',
    'unisex long-sleeve top': 'Top unisex a maniche lunghe',
    'unisex pants': 'Pantaloni unisex',
    'unisex t-shirt': 'T-shirt unisex',
    'tai bikini bottoms': 'Bikini tai inferiore',
    'wired bikini top': 'Top bikini con ferretto',
    'wired body': 'Body con ferretto',
    'wired bra': 'Reggiseno con ferretto',
    'wired bra with detachable straps': 'Reggiseno con ferretto e spalline staccabili',
    'wired padded bra': 'Reggiseno imbottito con ferretto',
    'wired padded bra with detachable straps': 'Reggiseno imbottito con spalline staccabili e ferretto',
    'wired swimsuit': 'Costume da bagno con ferretto',
    'balconette bra': 'Reggiseno a balconcino',
    'bustier': 'Bustier',
    'romper': 'Tuta',
    'scarf': 'Sciarpa',
    'sweater': 'Maglione',
    'cyclist shorts': 'Ciclisti',
    'racer top': 'Top Racer',
    't-shirt': 'T-shirt',
    'bodies': 'Bodies',
    'top': 'Top',
    'soft bra': 'Soft bra',
    'ultra bra': 'Ultra bra',
    'beach towel': 'Badlakan',
    'blindfold': 'Ögonbindel',
    'cape': 'Cape',
    'choker': 'Choker',
    'collar': 'Krage',
    'garter belt': 'Höfthållare',
    'harness': 'Harness',
    'jumpsuit': 'Tuta jumpsuit',
    'kaftan': 'Kaftan',
    'kimono': 'Kimono',
    'nipple cover': 'Bröstvårdsskydd',
    'suspender': 'Strumphållare',
    'suspender belt': 'Strumpebandshållare',
    'wired bikini top with padded cups': 'Top bikini con ferretto e coppe imbottite',
    'men\'s brief': 'Slip uomo',
    'men\'s boxer shorts': 'Boxer short uomo',
    'men\'s socks': 'Calze uomo',
    'men\'s trunks': 'Boxer aderenti uomo',
    'pyjama tops': 'Maglie pigiama',
    'pyjama bottoms': 'Pantaloni pigiama',
    'pyjama sets': 'Completi pigiama',
    'tops': 'Top',
    'sweaters/hoodies': 'Maglioni/Felpe',
    'bottoms': 'Pantaloni',
    'loungewear sets': 'Completi Loungewear'
  },

  // French
  'fr': {
    'shaping shorts': 'Short modelant',
    'pyjama top': 'Haut de pyjama',
    'shirt': 'Haut',
    'dirndl': 'Soutien-gorge dirndl',
    'non-wired padded bra': 'Soutien-gorge ampliforme sans armatures',
    'robe top': 'Haut de robe de chambre',
    'bandeau bikini top': 'Haut de bikini bandeau',
    'bandeau bra': 'Soutien-gorge bandeau',
    'bandeau knickers': 'Slip bandeau',
    'bandeau swimsuit': 'Maillot de bain bandeau',
    'bikini top with removable pads': 'Haut de bikini avec bonnets amovibles',
    'body': 'Body',
    'bolero': 'Boléro',
    'bralette': 'Bralette',
    'bra-top': 'Top soutien-gorge',
    'brazilian bikini bottoms': 'Bikini bas brésilien',
    'brazilian knickers': 'Brésilien',
    'cardigan': 'Cardigan',
    'corset': 'Corset',
    'dress': 'Robe',
    'face mask': 'Masque visage',
    'highleg bikini bottoms': 'Bas de bikini échancré',
    'highleg knickers': 'Culotte échancrée',
    'highwaist bikini bottoms': 'Bas de bikini taille haute',
    'highwaist knickers': 'Culotte taille haute',
    'highwaist shaping knickers': 'Culotte taille haute sculptante',
    'hipster bikini bottoms': 'Bas de bikin hipster',
    'hipster knickers': 'Hipster',
    'hood': 'Capuche',
    'hoodie': 'Sweat à capuche',
    'jacket': 'Veste',
    'leggings': 'Leggings',
    'long-sleeve top': 'Top à manches longues',
    'maxi bikini bottoms': 'Bas de bikini maxi',
    'maxi knickers': 'Culotte maxi',
    'men\'s hipster briefs': 'Hipster homme',
    'men\'s maxi briefs': 'Maxi homme',
    'men\'s midi briefs': 'Midi homme',
    'men\'s mini briefs': 'Mini homme',
    'men\'s shorts': 'Short homme',
    'men\'s swim slip': 'Slip de bain homme',
    'men\'s swimshorts': 'Short de bain homme',
    'men\'s tank top': 'Débardeur homme',
    'men\'s t-shirt': 'T-shirt homme',
    'midi bikini bottoms': 'Bas de bikini midi',
    'midi knickers': 'Culotte midi',
    'mini bikini bottoms': 'Bas de bikini mini',
    'mini knickers': 'Culotte mini',
    'minimizer bra': 'Soutien-gorge minimiseur',
    'minimizer sports bra': 'Soutien-gorge de sport minimiseur',
    'nightdress': 'Chemise de nuit',
    'minimizer bikini top': 'Haut de bikini minimiseur',
    'non-wired bra': 'Soutien-gorge sans armature',
    'nursing bra': 'Soutien-gorge d\'allaitement',
    'non-wired bikini top': 'Haut de bikini sans armature',
    'padded bikini top': 'Haut de bikini rembourré avec bretelles amovibles',
    'padded bra': 'Soutien-gorge rembourré',
    'padded bra with detachable straps': 'Soutien-gorge rembourré avec bretelles amovibles',
    'panty girdle': 'Gaine',
    'pareo': 'Paréo',
    'period hipster knickers': 'Culotte menstruelle hipster',
    'period short knickers': 'Culotte menstruelle shorty',
    'period tai knickers': 'Culotte menstruelle tai',
    'playsuit': 'Combinaison',
    'padded bikini top with detachable straps': 'Haut de bikini rembourré',
    'push-up bra': 'Soutien-gorge push-up',
    'push-up bra with front closure': 'Soutien-gorge push-up avec fermeture frontale',
    'pyjama set': 'Ensemble pyjama',
    'robe': 'Peignoir',
    'shaping body': 'Body sculptant',
    'shaping body wired': 'Body sculptant avec armature',
    'shaping bra': 'Soutien-gorge sculptant',
    'shaping hipster knickers': 'Hipster sculptant',
    'shaping maxi knickers': 'Culotte maxi sculptante',
    'shaping string': 'String sculptant',
    'shaping tai knickers': 'Culotte tai sculptante',
    'shaping vest': 'Débardeur sculptant',
    'short knickers': 'Culotte courte',
    'shorts': 'Short',
    'short-sleeve top': 'Top à manches courtes',
    'silicon straps': 'Bretelles en silicone',
    'slip skirt': 'Jupe portefeuille',
    'slippers': 'Chaussons',
    'socks': 'Chaussettes',
    'sports bra': 'Soutien-gorge de sport',
    'sports leggings': 'Leggings de sport',
    'string': 'String',
    'swimsuit': 'Maillot de bain',
    'swimsuit with padded cups': 'Maillot de bain avec bonnets rembourrés',
    'tanga': 'Tanga',
    'push-up bikini top': 'Haut de bikini push-up',
    'tai knickers': 'Culotte tai',
    'tank top': 'Débardeur',
    'tankini': 'Tankini',
    'top with spaghetti straps': 'Top à fines bretelles',
    'trousers': 'Pantalon',
    't-shirt bra': 'Soutien-gorge T-shirt',
    'tunic': 'Tunique',
    'unisex leggings': 'Leggings unisexe',
    'unisex long-sleeve top': 'Top unisexe à manches longues',
    'unisex pants': 'Pantalon unisexe',
    'unisex t-shirt': 'T-shirt unisexe',
    'tai bikini bottoms': 'Bas de bikini tai',
    'wired bikini top': 'Haut de bikini avec armature',
    'wired body': 'Body avec armature',
    'wired bra': 'Soutien-gorge avec armature',
    'wired bra with detachable straps': 'Soutien-gorge avec armature et bretelles amovibles',
    'wired padded bra': 'Soutien-gorge rembourré avec armature',
    'wired padded bra with detachable straps': 'Soutien-gorge rembourré avec bretelles amovibles et armature',
    'wired swimsuit': 'Maillot de bain avec armature',
    'balconette bra': 'Soutien-gorge balconnet',
    'bustier': 'Bustier',
    'romper': 'Combinaison',
    'scarf': 'Écharpe',
    'sweater': 'Pull',
    'cyclist shorts': 'Cycliste',
    'racer top': 'Débardeur',
    't-shirt': 'T-shirt',
    'bodies': 'Bodys',
    'top': 'Top',
    'soft bra': 'Soft bra',
    'ultra bra': 'Ultra bra',
    'beach towel': 'Badehåndklæde',
    'blindfold': 'Blindfold',
    'cape': 'Cape',
    'choker': 'Ras-du-cou',
    'collar': 'Col',
    'garter belt': 'Ceinture porte-jarretelles',
    'harness': 'Modèle à liens',
    'jumpsuit': 'Combinaison',
    'kaftan': 'Kaftan',
    'kimono': 'Kimono',
    'nipple cover': 'Cache-tétons',
    'suspender': 'Porte-jarretelles',
    'suspender belt': 'Ceinture porte-jarretelles',
    'wired bikini top with padded cups': 'Haut de bikini avec armature et bonnets rembourrés',
    'men\'s brief': 'Slip pour homme',
    'men\'s boxer shorts': 'Boxer pour homme',
    'men\'s socks': 'Chaussettes pour homme',
    'men\'s trunks': 'Boxer pour homme',
    'pyjama tops': 'Hauts de pyjama',
    'pyjama bottoms': 'Bas de pyjama',
    'pyjama sets': 'Ensembles de pyjama',
    'tops': 'Hauts',
    'sweaters/hoodies': 'Pulls/Sweats',
    'bottoms': 'Bas',
    'loungewear sets': 'Ensembles Loungewear'
  }
};

// Product code patterns to remove from descriptions
export const productCodePatterns = [
  /\b(WHP|W01|NDK|W\d{2,3}|N\d{2,3}|[A-Z]{2,3}\d{2,3})\b/gi,
  /\b[A-Z]{2,4}\d{2,4}\b/g,
  /\b\d{6,8}\b/g
];

// Function to clean product codes from text
export function removeProductCodes(text: string): string {
  let cleanedText = text;
  
  for (const pattern of productCodePatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Clean up extra spaces and punctuation
  cleanedText = cleanedText
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s*\.\s*\./g, '.')
    .replace(/^\s*[,\s]+/, '')
    .replace(/[,\s]+$/, '')
    .trim();
    
  return cleanedText;
}

const escapeForRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface LanguageMatchers {
  /** Matches every source term in the map, longest first. */
  keys: RegExp;
  /** Matches every already-localised term in the map, longest first. */
  values: RegExp;
  /** Lowercased source term → replacement. */
  lookup: Map<string, string>;
}

// Cache the matchers per language: building them means sorting and escaping
// ~180 entries, and every generated description runs through here.
const matcherCache = new Map<string, LanguageMatchers>();

function buildAlternation(terms: string[]): RegExp {
  // Longest first so 't-shirt bra' is tried before 't-shirt', and 't-shirt'
  // before 'shirt'.
  const alternation = [...new Set(terms)]
    .sort((a, b) => b.length - a.length)
    .map(escapeForRegex)
    .join('|');

  return new RegExp(`\\b(?:${alternation})\\b`, 'gi');
}

function getMatchers(language: string, languageMap: Record<string, string>): LanguageMatchers {
  const cached = matcherCache.get(language);
  if (cached) return cached;

  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(languageMap)) {
    const lowerKey = key.toLowerCase();
    // The PT map deliberately holds both 'Forro suave …' and 'forro suave …'
    // so the replacement can keep the source capitalisation; first one wins.
    if (!lookup.has(lowerKey)) lookup.set(lowerKey, value);
  }

  const matchers: LanguageMatchers = {
    keys: buildAlternation(Object.keys(languageMap)),
    values: buildAlternation(Object.values(languageMap)),
    lookup,
  };

  matcherCache.set(language, matchers);
  return matchers;
}

/** Character ranges already holding a correctly localised term. */
function findLocalisedRanges(text: string, values: RegExp): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  values.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = values.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
    if (match[0].length === 0) values.lastIndex++;
  }

  return ranges;
}

// Function to apply terminology corrections
export function applyTerminologyCorrections(text: string, language: string): string {
  const languageMap = terminologyMap[language];
  if (!languageMap) return text;

  const { keys, values, lookup } = getMatchers(language, languageMap);

  // Two guards, both learned from the DE product pages:
  //
  // 1. One pass over the text, never re-reading what a replacement just wrote.
  //    Replacing entry by entry let a later key match inside an earlier key's
  //    output — 't-shirt bra' produced "T-Shirt-BH", then 'shirt' → 'Hemd'
  //    turned that into "T-Hemd-BH".
  // 2. Skip anything sitting inside an already-localised term, so a source key
  //    that is a substring of some target term leaves it alone: "Bolero-Shirt"
  //    must not become "Bolero-Hemd", "Dirndl-BH" must not gain a second "-BH".
  const localised = findLocalisedRanges(text, values);
  const insideLocalised = (start: number, end: number): boolean =>
    localised.some(([from, to]) => start >= from && end <= to);

  keys.lastIndex = 0;

  return text.replace(keys, (match, offset: number) => {
    if (insideLocalised(offset, offset + match.length)) return match;

    // Exact hit first so an entry's own capitalisation is preserved.
    if (match in languageMap) return languageMap[match];

    return lookup.get(match.toLowerCase()) ?? match;
  });
}

/**
 * Known mistranslations to repair in already-localised copy.
 *
 * Two jobs: undo the damage the sequential-replace bug left in descriptions
 * that are re-imported for rework, and put back the English technical terms
 * sloggi ships unchanged on every market (reported from the DE site as
 * "punktverschweißte Kanten" and "Innovative Punktverschweiß-Technologie").
 */
const mistranslationFixes: Record<string, Array<[RegExp, string]>> = {
  de: [
    // Dot-Bonding stays English. Adjective forms collapse into a compound so
    // "punktverschweißten Kanten" reads "Dot-Bonding-Kanten", not "Dot-Bonding Kanten".
    [/\bpunktverschwei(?:ß|ss)te[nmrs]?\s+/gi, 'Dot-Bonding-'],
    [/\bpunktverschwei(?:ß|ss)(?:ung|en|t)?(?=-)/gi, 'Dot-Bonding'],
    [/\bpunktverschwei(?:ß|ss)(?:technik|technologie)\b/gi, 'Dot-Bonding-Technologie'],
    [/\bpunktverschwei(?:ß|ss)(?:ung|en|t)?\b/gi, 'Dot-Bonding'],

    // Leftovers from the sequential-replace bug. Order matters: repair the
    // intact "T-Hemd" first, so the compound rules below only see the cases
    // where the series pattern had already eaten the "T" ("ADAPT-Hemd BH").
    [/\bT-Hemd\b/gi, 'T-Shirt'],
    [/([A-Za-zÀ-ÿ])-Hemd([-\s])(BH|Bra)\b/gi, '$1 T-Shirt-$3'],
    [/\bHemd[-\s](BH|Bra)\b/gi, 'T-Shirt-$1'],

    // Declined forms too: the live pages carry both "Hochgeschnittener
    // Miederslip" and "Dieser hochgeschnittene Miederslip".
    [/\bhochgeschnittene[nmrs]?\s+Miederslip\b/gi, 'High Waist Slip'],
    [/\bMiederslip\b/g, 'High Waist Slip'],
  ],
  it: [
    // 'shirt' -> 'Camicia' hit inside compounds, so repair the whole compound.
    [/\b([A-Za-zÀ-ÿ]+)-Camicia\b/g, '$1-shirt'],
  ],
  fr: [
    // Same for 'shirt' -> 'Haut'. Case-sensitive on purpose: a capitalised
    // "Haut" mid-sentence after a hyphen is the bug, whereas French prose
    // legitimately uses lowercase "haut".
    [/\b([A-Za-zÀ-ÿ]+)-Haut\b/g, '$1-shirt'],
  ],
  es: [
    [/\bT-Camiseta\b/gi, 'Camiseta'],
  ],
};

export function applyMistranslationFixes(text: string, language: string): string {
  const fixes = mistranslationFixes[language];
  if (!fixes) return text;

  let corrected = text;
  for (const [pattern, replacement] of fixes) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}

// Function to get correct terminology for a product type
export function getCorrectTerminology(productType: string, language: string): string {
  const languageMap = terminologyMap[language];
  if (!languageMap) return productType;
  
  // Try exact match first
  if (languageMap[productType.toLowerCase()]) {
    return languageMap[productType.toLowerCase()];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(languageMap)) {
    if (productType.toLowerCase().includes(key) || key.includes(productType.toLowerCase())) {
      return value;
    }
  }
  
  return productType;
}

// Function to normalize series names according to brand guidelines
export function normalizeSeriesName(seriesName: string): string {
  if (!seriesName) return seriesName;
  
  let normalized = seriesName;
  
  // Remove "O-" or "O - " prefix from series names
  normalized = normalized.replace(/^O\s*-\s*/i, '');
  
  // Remove trailing "T" from series names (e.g., "Ladyform Soft T" → "Ladyform Soft")
  normalized = normalized.replace(/\s+T$/i, '');
  
  return normalized.trim();
}

// Function to format series name with proper article for language
export function formatSeriesReference(seriesName: string, language: string): string {
  const normalized = normalizeSeriesName(seriesName);
  
  // Format based on language
  switch (language.toLowerCase()) {
    case 'pt':
    case 'pt-pt':
      return `a série ${normalized}`;
    case 'pt-br':
      return `a série ${normalized}`;
    case 'es':
      return `la serie ${normalized}`;
    case 'it':
      return `la serie ${normalized}`;
    case 'fr':
      return `la série ${normalized}`;
    case 'de':
      return `die ${normalized}-Serie`;
    default:
      return `the ${normalized} series`;
  }
}

// Function to process text with all corrections
export function processTextWithTerminology(text: string, language: string): string {
  // Remove product codes first
  let processedText = removeProductCodes(text);

  // Apply terminology corrections
  processedText = applyTerminologyCorrections(processedText, language);

  // Repair known mistranslations and restore do-not-translate technical terms
  processedText = applyMistranslationFixes(processedText, language);

  // Normalize any series names in the text
  // Match common series name patterns. The trailing-T patterns must not fire on
  // a hyphenated word: "THE UP T-Shirt Bra" is a product name, and stripping its
  // "T" is how the DE page ended up reading "THE UP-Hemd Bra".
  const seriesPatterns = [
    /\bO\s*-\s*([A-Z][a-zA-Z\s]+?)(?:\s+T(?![-\w]))?\b/g,
    /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+T(?![-\w])/g,
  ];

  for (const pattern of seriesPatterns) {
    processedText = processedText.replace(pattern, (match) => {
      return normalizeSeriesName(match);
    });
  }

  return processedText;
}
