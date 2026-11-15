type Entry = [
  games: string,
  generation: string,
  english: string,
  portuguese: string,
]
export const regions: Record<string, Entry> = {
  kanto: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Pallet Town starts the adventure, and the Indigo Plateau hosts Kanto’s Pokémon League.',
    'A aventura começa em Pallet Town, e o Planalto Índigo abriga a Liga Pokémon de Kanto.',
  ],
  johto: [
    'Gold / Silver · HeartGold / SoulSilver',
    'II',
    'Johto is home to Goldenrod City, the Ruins of Alph, and the Lake of Rage.',
    'Johto abriga Goldenrod City, as Ruínas de Alph e o Lago da Fúria.',
  ],
  hoenn: [
    'Ruby / Sapphire · Omega Ruby / Alpha Sapphire',
    'III',
    'Sea routes link much of Hoenn. The Sky Pillar is home to Rayquaza.',
    'Rotas marítimas conectam boa parte de Hoenn. Rayquaza vive no Pilar Celeste.',
  ],
  sinnoh: [
    'Diamond / Pearl · Brilliant Diamond / Shining Pearl',
    'IV',
    'Mount Coronet divides Sinnoh, and its three lakes are tied to local legends.',
    'O Monte Coronet divide Sinnoh, e seus três lagos estão ligados a lendas locais.',
  ],
  unova: [
    'Black / White · Black 2 / White 2',
    'V',
    'The Skyarrow Bridge leads to Castelia City. The sequel games introduce Pokéstar Studios.',
    'A Ponte Skyarrow leva a Castelia City. Os jogos da continuação apresentam os estúdios Pokéstar.',
  ],
  kalos: [
    'X / Y · Legends: Z-A',
    'VI',
    'Lumiose City is Kalos’s largest city. The region introduced Mega Evolution.',
    'Lumiose City é a maior cidade de Kalos. A região apresentou a Megaevolução.',
  ],
  alola: [
    'Sun / Moon · Ultra Sun / Ultra Moon',
    'VII',
    'Alola’s island challenge takes Trainers through trials across four islands.',
    'O desafio insular de Alola leva os Treinadores a provas em quatro ilhas.',
  ],
  galar: [
    'Sword / Shield',
    'VIII',
    'Galar is home to the Wild Area and stadiums built for Dynamax battles.',
    'Galar abriga a Área Selvagem e estádios preparados para batalhas Dynamax.',
  ],
  hisui: [
    'Legends: Arceus',
    'VIII',
    'Hisui is Sinnoh in the distant past. The Survey Corps operates from Jubilife Village.',
    'Hisui é Sinnoh no passado distante. A Divisão de Pesquisa atua a partir da Vila Jubilife.',
  ],
  paldea: [
    'Scarlet / Violet',
    'IX',
    'Paldea is home to Mesagoza and the Great Crater. Trainers can make sandwiches with their Pokémon at picnics.',
    'Paldea abriga Mesagoza e a Grande Cratera. Treinadores podem preparar sanduíches com seus Pokémon nos piqueniques.',
  ],
}

export const protagonists: Record<string, Entry> = {
  red: [
    'Red / Green · FireRed',
    'I',
    'Red starts his journey in Pallet Town and later appears as a challenger on Mt. Silver.',
    'Red começa sua jornada em Pallet Town e depois aparece como desafiante no Monte Silver.',
  ],
  leaf: [
    'FireRed / LeafGreen',
    'III',
    'Leaf is a playable Trainer from Pallet Town in the Kanto remakes.',
    'Leaf é uma Treinadora jogável de Pallet Town nos remakes de Kanto.',
  ],
  ethan: [
    'Gold / Silver · HeartGold / SoulSilver',
    'II',
    'Ethan sets out from New Bark Town at the start of his Johto adventure.',
    'Ethan parte de New Bark Town no início da aventura em Johto.',
  ],
  lyra: [
    'HeartGold / SoulSilver',
    'IV',
    'Lyra is a playable Trainer from New Bark Town in the Johto remakes.',
    'Lyra é uma Treinadora jogável de New Bark Town nos remakes de Johto.',
  ],
  brendan: [
    'Ruby / Sapphire · Omega Ruby / Alpha Sapphire',
    'III',
    'Brendan is a playable Trainer whose Hoenn journey begins in Littleroot Town.',
    'Brendan é um Treinador jogável cuja jornada em Hoenn começa em Littleroot Town.',
  ],
  may: [
    'Ruby / Sapphire · Omega Ruby / Alpha Sapphire',
    'III',
    'May can be the protagonist or your rival in Hoenn.',
    'May pode ser a protagonista ou sua rival em Hoenn.',
  ],
  dawn: [
    'Diamond / Pearl · Brilliant Diamond / Shining Pearl',
    'IV',
    'Dawn can be the protagonist or Professor Rowan’s assistant in Sinnoh.',
    'Dawn pode ser a protagonista ou a assistente do Professor Rowan em Sinnoh.',
  ],
  hilbert: [
    'Black / White',
    'V',
    'Hilbert begins his Unova journey in Nuvema Town alongside Cheren and Bianca.',
    'Hilbert começa sua jornada em Unova, em Nuvema Town, ao lado de Cheren e Bianca.',
  ],
  hilda: [
    'Black / White',
    'V',
    'Hilda is a playable Trainer who sets out from Nuvema Town in Unova.',
    'Hilda é uma Treinadora jogável que parte de Nuvema Town, em Unova.',
  ],
}

export const opponents: Record<string, Entry> = {
  brock: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Brock awards the Boulder Badge at the Rock-type Gym in Pewter City.',
    'Brock entrega a Insígnia da Pedra no Ginásio do tipo Pedra de Pewter City.',
  ],
  misty: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Misty leads Cerulean City’s Water-type Gym. Starmie is one of her signature Pokémon.',
    'Misty lidera o Ginásio do tipo Água de Cerulean City. Starmie é um dos seus Pokémon mais conhecidos.',
  ],
  'lt-surge': [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Lt. Surge leads Vermilion City’s Electric-type Gym and is known for his Raichu.',
    'Lt. Surge lidera o Ginásio do tipo Elétrico de Vermilion City e é conhecido por seu Raichu.',
  ],
  erika: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Erika leads the Grass-type Gym in Celadon City.',
    'Erika lidera o Ginásio do tipo Planta de Celadon City.',
  ],
  blaine: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Blaine specializes in Fire-type Pokémon and quizzes challengers at the Cinnabar Gym.',
    'Blaine é especialista no tipo Fogo e desafia os visitantes com perguntas no Ginásio de Cinnabar.',
  ],
  lorelei: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Lorelei opens the Indigo Plateau Elite Four challenge with Ice-type Pokémon such as Lapras.',
    'Lorelei abre o desafio da Elite dos Quatro no Planalto Índigo com Pokémon do tipo Gelo, como Lapras.',
  ],
  agatha: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Agatha uses Ghost-type Pokémon such as Gengar in the Indigo Plateau Elite Four.',
    'Agatha usa Pokémon do tipo Fantasma, como Gengar, na Elite dos Quatro do Planalto Índigo.',
  ],
  bruno: [
    'Red / Green · FireRed / LeafGreen',
    'I',
    'Bruno is an Elite Four member known for Fighting-type Pokémon such as Machamp.',
    'Bruno integra a Elite dos Quatro e é conhecido por Pokémon do tipo Lutador, como Machamp.',
  ],
  karen: [
    'Gold / Silver · HeartGold / SoulSilver',
    'II',
    'Karen specializes in Dark-type Pokémon and is the final Elite Four member in Johto’s League challenge.',
    'Karen é especialista no tipo Sombrio e é a última integrante da Elite dos Quatro no desafio da Liga de Johto.',
  ],
  lance: [
    'Red / Green · Gold / Silver',
    'I',
    'Lance appears in Kanto’s Elite Four before becoming Champion in Gold and Silver. His signature Pokémon is Dragonite.',
    'Lance integra a Elite dos Quatro de Kanto antes de se tornar Campeão em Gold e Silver. Seu Pokémon mais conhecido é Dragonite.',
  ],
  steven: [
    'Ruby / Sapphire · Omega Ruby / Alpha Sapphire',
    'III',
    'Steven is the Hoenn Champion in Ruby and Sapphire and battles with Metagross.',
    'Steven é o Campeão de Hoenn em Ruby e Sapphire e batalha com Metagross.',
  ],
  cynthia: [
    'Diamond / Pearl · Brilliant Diamond / Shining Pearl',
    'IV',
    'Cynthia is the Sinnoh Champion, studies regional mythology, and is known for her Garchomp.',
    'Cynthia é a Campeã de Sinnoh, estuda a mitologia da região e é conhecida por seu Garchomp.',
  ],
}
