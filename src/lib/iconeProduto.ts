/*
 * Ícone do produto pelo nome (EQZ-30). Ícones: Microsoft Fluent Emoji 3D (licença MIT, crédito em
 * /licencas), convertidos para WebP 128 px em public/icones/produtos/<chave>.webp. Eram 80 (prévia
 * aprovada em 2026-10-17); em 2026-10-20 viraram 231, com frutas, doces, beleza, papelaria,
 * eletrônicos, festa e jardim. "destilado" virou a garrafa e "espumante" as taças brindando (o copo
 * baixo ficava confuso pequeno).
 * Ordem da imagem no app: foto (da pessoa ou da embalagem) → ícone escolhido à mão (products.icon)
 * → ícone pelo nome → iniciais. "nenhum" em products.icon força as iniciais.
 * O dicionário e o algoritmo vêm da prévia aprovada pelo João em 2026-10-17.
 */

export const SEM_ICONE = "nenhum";

/* Nome em português e grupo de cada ícone (a ordem é a da grade de escolha) */
export const ICONES: Record<string, [string, string]> = {
  cerveja: ["Cerveja", "Bebidas"], espumante: ["Espumante", "Bebidas"], vinho: ["Vinho", "Bebidas"],
  destilado: ["Destilado", "Bebidas"], drink: ["Drink", "Bebidas"], refri: ["Refrigerante", "Bebidas"],
  gelo: ["Gelo", "Bebidas"], agua: ["Água", "Bebidas"], suco: ["Suco", "Bebidas"], cafe: ["Café", "Bebidas"],
  cha: ["Chá", "Bebidas"], chimarrao: ["Erva-mate", "Bebidas"], mamadeira: ["Mamadeira", "Bebidas"],
  limao: ["Limão", "Frutas e verduras"], tomate: ["Tomate", "Frutas e verduras"],
  cebola: ["Cebola", "Frutas e verduras"], alho: ["Alho", "Frutas e verduras"],
  batata: ["Batata", "Frutas e verduras"], cenoura: ["Cenoura", "Frutas e verduras"],
  folhas: ["Verduras", "Frutas e verduras"], maca: ["Maçã", "Frutas e verduras"],
  pera: ["Pera", "Frutas e verduras"], laranja: ["Laranja", "Frutas e verduras"],
  banana: ["Banana", "Frutas e verduras"], melancia: ["Melancia", "Frutas e verduras"],
  uva: ["Uva", "Frutas e verduras"], morango: ["Morango", "Frutas e verduras"],
  melao: ["Melão", "Frutas e verduras"], cereja: ["Cereja", "Frutas e verduras"],
  pessego: ["Pêssego", "Frutas e verduras"], manga: ["Manga", "Frutas e verduras"],
  abacaxi: ["Abacaxi", "Frutas e verduras"], coco: ["Coco", "Frutas e verduras"],
  kiwi: ["Kiwi", "Frutas e verduras"], abacate: ["Abacate", "Frutas e verduras"],
  mirtilo: ["Mirtilo", "Frutas e verduras"], berinjela: ["Berinjela", "Frutas e verduras"],
  pimentao: ["Pimentão", "Frutas e verduras"], pepino: ["Pepino", "Frutas e verduras"],
  brocolis: ["Brócolis", "Frutas e verduras"], milho: ["Milho", "Frutas e verduras"],
  cogumelo: ["Cogumelo", "Frutas e verduras"], amendoim: ["Amendoim", "Frutas e verduras"],
  castanha: ["Castanha", "Frutas e verduras"], feijao: ["Feijão", "Frutas e verduras"],
  gengibre: ["Gengibre", "Frutas e verduras"], ervilha: ["Ervilha", "Frutas e verduras"],
  batatadoce: ["Batata-doce", "Frutas e verduras"],
  queijo: ["Queijo", "Comida"], carne: ["Carne", "Comida"], frango: ["Frango", "Comida"], bacon: ["Bacon", "Comida"],
  arroz: ["Arroz", "Comida"], ovo: ["Ovo", "Comida"], pao: ["Pão", "Comida"], baguete: ["Baguete", "Comida"],
  manteiga: ["Manteiga", "Comida"], leite: ["Leite", "Comida"], macarrao: ["Massa", "Comida"],
  enlatado: ["Enlatado", "Comida"], pimenta: ["Pimenta", "Comida"], azeitona: ["Azeitona", "Comida"],
  mel: ["Mel", "Comida"], camarao: ["Camarão", "Comida"], peixe: ["Peixe", "Comida"], pizza: ["Pizza", "Comida"],
  hamburguer: ["Hambúrguer", "Comida"], salsicha: ["Salsicha", "Comida"], fritas: ["Fritas", "Comida"],
  sal: ["Sal", "Comida"], croissant: ["Croissant", "Comida"], tortilha: ["Tortilha", "Comida"],
  panqueca: ["Panqueca", "Comida"], waffle: ["Waffle", "Comida"], sanduiche: ["Sanduíche", "Comida"],
  taco: ["Taco", "Comida"], burrito: ["Burrito", "Comida"], pastel: ["Pastel", "Comida"],
  frigideira: ["Frigideira", "Comida"], sopa: ["Sopa", "Comida"], cereal: ["Cereal", "Comida"],
  salada: ["Salada", "Comida"], pipoca: ["Pipoca", "Comida"], lamen: ["Lámen", "Comida"], sushi: ["Sushi", "Comida"],
  marmita: ["Marmita", "Comida"], caranguejo: ["Caranguejo", "Comida"], lagosta: ["Lagosta", "Comida"],
  lula: ["Lula", "Comida"], ostra: ["Ostra", "Comida"], pote: ["Pote", "Comida"],
  bolo: ["Bolo", "Doces"], docinho: ["Doce", "Doces"], chocolate: ["Chocolate", "Doces"],
  sorvete: ["Sorvete", "Doces"], rosquinha: ["Rosquinha", "Doces"], biscoito: ["Biscoito", "Doces"],
  torta: ["Torta", "Doces"], bala: ["Bala", "Doces"], pirulito: ["Pirulito", "Doces"], pudim: ["Pudim", "Doces"],
  camiseta: ["Camiseta", "Roupas"], blusa: ["Blusa", "Roupas"], calca: ["Calça", "Roupas"],
  vestido: ["Vestido", "Roupas"], short: ["Bermuda", "Roupas"], camisa: ["Camisa social", "Roupas"],
  casaco: ["Casaco", "Roupas"], meia: ["Meia", "Roupas"], tenis: ["Tênis", "Roupas"], salto: ["Salto", "Roupas"],
  sandalia: ["Sandália", "Roupas"], chinelo: ["Chinelo", "Roupas"], bone: ["Boné", "Roupas"],
  bolsa: ["Bolsa", "Roupas"], biquini: ["Biquíni", "Roupas"], cueca: ["Íntima", "Roupas"], bota: ["Bota", "Roupas"],
  cachecol: ["Cachecol", "Roupas"], maio: ["Maiô", "Roupas"], luva: ["Luva", "Roupas"],
  carteira: ["Carteira", "Roupas"], mochila: ["Mochila", "Roupas"], sapato: ["Sapato", "Roupas"],
  sapatilha: ["Sapatilha", "Roupas"], chapeu: ["Chapéu", "Roupas"], capacete: ["Capacete", "Roupas"],
  jaleco: ["Jaleco", "Roupas"], colete: ["Colete", "Roupas"],
  batom: ["Maquiagem", "Beleza e saúde"], esmalte: ["Esmalte", "Beleza e saúde"],
  remedio: ["Remédio", "Beleza e saúde"], curativo: ["Curativo", "Beleza e saúde"],
  seringa: ["Seringa", "Beleza e saúde"], termometro: ["Termômetro", "Beleza e saúde"],
  escova: ["Escova", "Beleza e saúde"], barbeador: ["Barbeador", "Beleza e saúde"], anel: ["Anel", "Beleza e saúde"],
  joia: ["Joia", "Beleza e saúde"], oculos: ["Óculos", "Beleza e saúde"],
  oculossol: ["Óculos de sol", "Beleza e saúde"],
  cachorro: ["Cachorro", "Pet"], gato: ["Gato", "Pet"], osso: ["Petisco", "Pet"], pet: ["Acessório pet", "Pet"],
  passaro: ["Pássaro", "Pet"], aquario: ["Aquário", "Pet"], hamster: ["Hamster", "Pet"], coelho: ["Coelho", "Pet"],
  tartaruga: ["Tartaruga", "Pet"],
  sabao: ["Sabão", "Limpeza e casa"], frasco: ["Frasco", "Limpeza e casa"], esponja: ["Esponja", "Limpeza e casa"],
  papel: ["Papel", "Limpeza e casa"], vassoura: ["Vassoura", "Limpeza e casa"], balde: ["Balde", "Limpeza e casa"],
  cesto: ["Cesto", "Limpeza e casa"], desentupidor: ["Desentupidor", "Limpeza e casa"],
  vela: ["Vela", "Limpeza e casa"], extintor: ["Extintor", "Limpeza e casa"],
  ratoeira: ["Ratoeira", "Limpeza e casa"], alfinete: ["Alfinete", "Limpeza e casa"],
  linha: ["Linha", "Limpeza e casa"], novelo: ["Novelo", "Limpeza e casa"], agulha: ["Agulha", "Limpeza e casa"],
  bule: ["Bule", "Limpeza e casa"], talheres: ["Talheres", "Limpeza e casa"], cadeado: ["Cadeado", "Limpeza e casa"],
  lixeira: ["Lixeira", "Limpeza e casa"],
  lapis: ["Lápis", "Papelaria"], caneta: ["Caneta", "Papelaria"], giz: ["Giz", "Papelaria"],
  caderno: ["Caderno", "Papelaria"], livro: ["Livro", "Papelaria"], tesoura: ["Tesoura", "Papelaria"],
  clipe: ["Clipe", "Papelaria"], tachinha: ["Tachinha", "Papelaria"], regua: ["Régua", "Papelaria"],
  envelope: ["Envelope", "Papelaria"], bloco: ["Bloco de notas", "Papelaria"], calendario: ["Agenda", "Papelaria"],
  etiqueta: ["Etiqueta", "Papelaria"],
  impressora: ["Impressora", "Eletrônicos"], celular: ["Celular", "Eletrônicos"],
  notebook: ["Notebook", "Eletrônicos"], fone: ["Fone", "Eletrônicos"], televisao: ["Televisão", "Eletrônicos"],
  pilha: ["Pilha", "Eletrônicos"], tomada: ["Tomada", "Eletrônicos"], lanterna: ["Lanterna", "Eletrônicos"],
  mouse: ["Mouse", "Eletrônicos"], teclado: ["Teclado", "Eletrônicos"],
  chave: ["Chave", "Oficina"], parafuso: ["Parafuso", "Oficina"], martelo: ["Martelo", "Oficina"],
  oleo: ["Óleo de motor", "Oficina"], pneu: ["Pneu", "Oficina"], lampada: ["Lâmpada", "Oficina"],
  fenda: ["Chave de fenda", "Oficina"], ferramentas: ["Ferramentas", "Oficina"], machado: ["Machado", "Oficina"],
  serrote: ["Serrote", "Oficina"], escada: ["Escada", "Oficina"], ima: ["Ímã", "Oficina"],
  tijolo: ["Tijolo", "Oficina"], pedra: ["Pedra", "Oficina"], madeira: ["Madeira", "Oficina"],
  gancho: ["Gancho", "Oficina"], corrente: ["Corrente", "Oficina"], pincel: ["Pincel", "Oficina"],
  tinta: ["Tinta", "Oficina"], engrenagem: ["Engrenagem", "Oficina"], combustivel: ["Combustível", "Oficina"],
  carro: ["Carro", "Oficina"], moto: ["Moto", "Oficina"], bicicleta: ["Bicicleta", "Oficina"],
  carvao: ["Carvão e gás", "Oficina"],
  balao: ["Balão", "Festa e presentes"], presente: ["Presente", "Festa e presentes"],
  confete: ["Artigos de festa", "Festa e presentes"], fita: ["Fita", "Festa e presentes"],
  brinquedo: ["Brinquedo", "Festa e presentes"], bola: ["Bola", "Festa e presentes"],
  muda: ["Muda e semente", "Jardim"], vaso: ["Planta", "Jardim"], cacto: ["Cacto", "Jardim"],
  flor: ["Flor", "Jardim"], girassol: ["Girassol", "Jardim"],
  caixa: ["Caixa", "Outros"], sacola: ["Sacola", "Outros"], cigarro: ["Cigarro", "Outros"],
};

export const urlIcone = (chave: string) => `/icones/produtos/${chave}.webp`;

/* Expressões de mais de uma palavra, testadas antes das palavras soltas */
const EXPRESSOES: [string, string][] = [
  ["chave de fenda", "fenda"], ["batata frita", "fritas"], ["batata palito", "fritas"],
  ["cachorro quente", "salsicha"], ["leite condensado", "enlatado"], ["creme de leite", "leite"],
  ["molho de tomate", "tomate"], ["extrato de tomate", "tomate"], ["agua sanitaria", "frasco"],
  ["papel higienico", "papel"], ["papel toalha", "papel"], ["palha de aco", "esponja"], ["file de frango", "frango"],
  ["peito de frango", "frango"], ["file de peixe", "peixe"], ["file de tilapia", "peixe"],
  ["oleo de soja", "frasco"], ["oleo de girassol", "frasco"], ["oleo de canola", "frasco"],
  ["oleo de cozinha", "frasco"], ["camisa social", "camisa"], ["pao de queijo", "pao"], ["oleo de motor", "oleo"],
  ["areia sanitaria", "gato"], ["erva mate", "chimarrao"], ["agua de coco", "coco"], ["coco ralado", "coco"],
  ["couve flor", "brocolis"], ["batata doce", "batatadoce"], ["creme dental", "escova"],
  ["pasta de dente", "escova"], ["oculos de sol", "oculossol"], ["saco de lixo", "lixeira"],
  ["bloco de notas", "bloco"], ["post it", "bloco"], ["gas de cozinha", "carvao"], ["caldo de cana", "suco"],
  ["carteira de cigarro", "cigarro"], ["vela de ignicao", "engrenagem"], ["chave inglesa", "chave"],
  ["fio dental", "escova"], ["protetor solar", "frasco"], ["feijao verde", "ervilha"],
];

/* Palavras que decidem o ícone */
const FORTES: Record<string, string> = {
  cerveja: "cerveja chopp chope heineken skol brahma budweiser amstel itaipava stella corona spaten",
  espumante: "espumante champanhe champagne prosecco sidra champanha cidra", vinho: "vinho",
  destilado: "whisky uisque vodka cachaca pinga gin rum tequila conhaque licor destilado campari",
  drink: "drink caipirinha coquetel aperol martini",
  refri: "refrigerante refri coca cocacola guarana fanta sprite pepsi soda tonica schweppes kuat copo", gelo: "gelo",
  agua: "agua", suco: "suco nectar caixinha", cafe: "cafe capuccino cappuccino expresso", cha: "cha camomila",
  chimarrao: "chimarrao terere", mamadeira: "mamadeira", limao: "limao lima", tomate: "tomate ketchup",
  cebola: "cebola", alho: "alho", batata: "batata mandioca aipim inhame", cenoura: "cenoura",
  folhas: "alface rucula couve espinafre agriao salsinha cebolinha manjericao coentro hortela verdura oregano",
  maca: "maca", pera: "pera", laranja: "laranja tangerina mexerica bergamota ponkan", banana: "banana",
  melancia: "melancia", uva: "uva passa", morango: "morango", melao: "melao", cereja: "cereja", pessego: "pessego",
  abacaxi: "abacaxi", coco: "coco", kiwi: "kiwi", abacate: "abacate guacamole", mirtilo: "mirtilo blueberry",
  berinjela: "berinjela", pimentao: "pimentao pimentoes", pepino: "pepino picles", brocolis: "brocolis brocoli",
  milho: "milho", cogumelo: "cogumelo champignon shimeji shitake", amendoim: "amendoim pacoca",
  castanha: "castanha noz nozes amendoa", feijao: "feijao", gengibre: "gengibre", ervilha: "ervilha vagem",
  queijo: "queijo mussarela mucarela mozarela mozzarella parmesao provolone cheddar requeijao catupiry gorgonzola ricota",
  carne: "carne picanha alcatra patinho acem contrafile maminha fraldinha costela cupim file moida bovina lombo",
  frango: "frango coxa sobrecoxa galinha chester peru", bacon: "bacon toucinho pancetta presunto", arroz: "arroz",
  ovo: "ovo", pao: "pao bisnaga torrada brioche", baguete: "baguete", manteiga: "manteiga margarina",
  leite: "leite iogurte nata", macarrao: "macarrao espaguete lasanha penne talharim nhoque",
  enlatado: "atum sardinha enlatado conserva palmito seleta", pimenta: "pimenta paprica tempero",
  azeitona: "azeitona azeite", mel: "mel", camarao: "camarao", peixe: "peixe tilapia salmao bacalhau merluza",
  pizza: "pizza", hamburguer: "hamburguer burger blend", salsicha: "salsicha linguica calabresa hotdog",
  fritas: "fritas", sal: "sal", croissant: "croissant", tortilha: "tortilha wrap pita", panqueca: "panqueca",
  waffle: "waffle", sanduiche: "sanduiche lanche", taco: "taco nacho", burrito: "burrito",
  pastel: "pastel guioza gyoza", frigideira: "frigideira", sopa: "sopa caldo panela",
  cereal: "cereal granola aveia sucrilhos", salada: "salada", pipoca: "pipoca", lamen: "lamen miojo",
  sushi: "sushi temaki sashimi", marmita: "marmita marmitex quentinha", caranguejo: "caranguejo siri",
  lagosta: "lagosta", lula: "lula polvo", ostra: "ostra marisco mexilhao", pote: "pote", bolo: "bolo",
  docinho: "doce brigadeiro beijinho cupcake confeito granulado",
  chocolate: "chocolate cacau achocolatado nescau bombom", sorvete: "sorvete picole casquinha",
  rosquinha: "rosquinha donut sonho", biscoito: "biscoito bolacha cookie", torta: "torta quiche",
  bala: "bala chiclete", pirulito: "pirulito", pudim: "pudim flan",
  camiseta: "camiseta regata camisetao tshirt polo", blusa: "blusa cropped body",
  calca: "calca jeans legging jogger", vestido: "vestido saia", short: "short bermuda", camisa: "camisa gravata",
  casaco: "casaco jaqueta moletom blazer sueter cardigan", meia: "meia meiao", tenis: "tenis sneaker",
  salto: "salto scarpin", sandalia: "sandalia rasteirinha tamanco", chinelo: "chinelo havaianas slide",
  bone: "bone viseira gorro", bolsa: "bolsa necessaire pochete", biquini: "biquini sunga",
  cueca: "cueca calcinha sutia lingerie", bota: "bota coturno", cachecol: "cachecol echarpe", maio: "maio",
  luva: "luva", carteira: "carteira", mochila: "mochila", sapato: "sapato mocassim", sapatilha: "sapatilha",
  chapeu: "chapeu", capacete: "capacete", jaleco: "jaleco", colete: "colete refletivo",
  batom: "batom gloss maquiagem rimel", esmalte: "esmalte",
  remedio: "remedio comprimido dipirona paracetamol", curativo: "curativo bandaid esparadrapo",
  seringa: "seringa vacina", termometro: "termometro", escova: "escova", barbeador: "barbeador gilete lamina",
  anel: "anel alianca", joia: "joia semijoia brinco colar pulseira", oculos: "oculos armacao",
  cachorro: "cachorro cao caes dog filhote", gato: "gato felino", osso: "osso petisco bifinho",
  pet: "coleira peitoral", passaro: "passaro calopsita periquito alpiste canario", aquario: "aquario",
  hamster: "hamster roedor", coelho: "coelho", tartaruga: "tartaruga jabuti",
  sabao: "sabao sabonete detergente amaciante",
  frasco: "shampoo xampu condicionador hidratante alcool desinfetante multiuso", esponja: "esponja bucha",
  papel: "papel guardanapo", vassoura: "vassoura rodo", balde: "balde", cesto: "cesto cesta",
  desentupidor: "desentupidor", vela: "vela", extintor: "extintor", ratoeira: "ratoeira raticida",
  alfinete: "alfinete", linha: "linha carretel", novelo: "novelo croche trico", agulha: "agulha",
  bule: "bule chaleira", talheres: "talher garfo faca", cadeado: "cadeado", lixeira: "lixeira",
  lapis: "lapis lapiseira", caneta: "caneta", giz: "giz", caderno: "caderno", livro: "livro apostila",
  tesoura: "tesoura", clipe: "clipe", tachinha: "tachinha percevejo", regua: "regua", envelope: "envelope",
  bloco: "postit", calendario: "agenda calendario", etiqueta: "etiqueta", impressora: "impressora toner cartucho",
  celular: "celular smartphone iphone", notebook: "notebook laptop", fone: "fone headset", televisao: "tv televisao",
  pilha: "pilha bateria", tomada: "tomada plug extensao adaptador", lanterna: "lanterna", mouse: "mouse",
  teclado: "teclado", chave: "chave alicate", parafuso: "parafuso porca arruela prego rebite", martelo: "martelo",
  oleo: "oleo lubrificante", pneu: "pneu roda camara", lampada: "lampada led farol", fenda: "philips",
  ferramentas: "ferramenta ferramentas", machado: "machado", serrote: "serrote serra", escada: "escada", ima: "ima",
  tijolo: "tijolo", pedra: "pedra brita", madeira: "madeira lenha tabua compensado mdf", gancho: "gancho",
  corrente: "corrente", pincel: "pincel rolo", tinta: "tinta", engrenagem: "engrenagem rolamento",
  combustivel: "gasolina combustivel diesel etanol", carro: "carro", moto: "moto motocicleta",
  bicicleta: "bicicleta bike", carvao: "carvao botijao", balao: "balao bexiga", presente: "presente embrulho",
  confete: "festa confete serpentina", fita: "fita laco", brinquedo: "brinquedo pelucia boneca", bola: "bola",
  muda: "muda semente adubo", vaso: "vaso planta", cacto: "cacto suculenta", flor: "flor buque",
  girassol: "girassol", sacola: "sacola sacolinha saco", cigarro: "cigarro fumo tabaco seda",
};

/* Palavras genéricas: só valem se nenhuma palavra forte aparecer no nome ("ração" do gato é gato) */
const FRACAS: Record<string, string> = {
  manga: "manga", cachorro: "racao", caixa: "caixa embalagem kit", frasco: "creme gel", blusa: "top", tomate: "molho", macarrao: "massa",
};

/* Palavras do Unicode CLDR em português (cldr-json, annotations/pt), escolhidas à mão: só as
   específicas de um ícone. Valem depois das palavras fortes e antes das genéricas */
const CLDR: Record<string, string> = {
  bala: "balinha", balde: "baldinho", barbeador: "barbear depilar raspar", batom: "makeup", berinjela: "beringela",
  bola: "futebol", bone: "beisebol", bolsa: "mala", brinquedo: "bichinho ursinho urso", bloco: "anotacoes memorando",
  cafe: "cafeina cafezinho", camarao: "crustaceo", caneta: "esferografica", carne: "bife cordeiro costeleta porco",
  carro: "automovel", carteira: "niqueleira bolsinha", casaco: "agasalho", cesto: "piquenique", cha: "xicara",
  chimarrao: "cuia", chinelo: "alpargatas", curativo: "atadura bandeide", docinho: "confeitaria",
  enlatado: "enlatada", envelope: "correspondencia", ervilha: "edamame", escova: "dental dentes",
  esmalte: "manicure unha unhas", etiqueta: "rotulo", flor: "tulipa", folhas: "repolho", fone: "fones",
  frango: "aves coxinha", frasco: "locao protetor solar", gato: "gatinho", hamburguer: "burguer", ima: "magnetico",
  impressora: "impressao", lamen: "ramen", limao: "siciliano", linha: "barbante", lixeira: "lixo", lula: "molusco",
  macarrao: "macarronada", milho: "espiga", muda: "broto plantinha", novelo: "tricotar", panqueca: "crepe crepes",
  pao: "tostex", papel: "higienico", pastel: "empanada", pedra: "pedregulho rocha seixo", peixe: "pesca",
  pimenta: "apimentada apimentado", pneu: "volante", pote: "jarra jarro recipiente", presente: "mimo",
  ratoeira: "armadilha", refri: "canudo", remedio: "pilula", sabao: "saboneteira", sal: "saleiro", salsicha: "vina",
  seringa: "injecao", sopa: "ensopado", suco: "suquinho", tachinha: "tacha", tijolo: "argamassa argila cimento",
  tinta: "paleta pintura", tomada: "plugue", tortilha: "arepa naan sirio", vaso: "samambaia", vinho: "calice",
  waffle: "gofre wafel wafle",
};

function paraMapa(src: Record<string, string>): Map<string, string> {
  const m = new Map<string, string>();
  for (const [chave, palavras] of Object.entries(src)) for (const p of palavras.split(" ")) m.set(p, chave);
  return m;
}
const FORTES_M = paraMapa(FORTES);
const FRACAS_M = paraMapa(FRACAS);
const CLDR_M   = paraMapa(CLDR);

function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/* Plural simples: "queijos" → "queijo", "pimentoes" → "pimento" (sem acento, como no normalizar) */
function variantes(t: string): string[] {
  const v = [t];
  if (t.length > 3 && t.endsWith("es")) v.push(t.slice(0, -2));
  if (t.length > 3 && t.endsWith("s")) v.push(t.slice(0, -1));
  return v;
}

/** Chave do ícone que combina com o nome do produto, ou null (ficam as iniciais). Ordem: expressões →
 *  palavras fortes (a primeira do nome vence) → palavras do CLDR → genéricas. */
export function iconeDoNome(nome: string): string | null {
  const n = normalizar(nome);
  const comEspacos = ` ${n} `;
  for (const [expr, chave] of EXPRESSOES) if (comEspacos.includes(` ${expr} `)) return chave;

  const palavras = n.split(" ");
  for (const mapa of [FORTES_M, CLDR_M, FRACAS_M]) {
    for (const palavra of palavras) {
      for (const v of variantes(palavra)) {
        const chave = mapa.get(v);
        if (chave) return chave;
      }
    }
  }
  return null;
}

/** Ícone a mostrar: o escolhido à mão (se existir), senão o do nome. null = iniciais. */
export function iconeDoProduto(nome: string, escolhido?: string | null): string | null {
  if (escolhido === SEM_ICONE) return null;
  if (escolhido && ICONES[escolhido]) return escolhido;
  return iconeDoNome(nome);
}

/** Busca do seletor de ícone: o que o dicionário acharia para o texto e os de rótulo parecido. */
export function buscarIcones(texto: string): string[] {
  const t = normalizar(texto);
  if (!t) return [];
  const peloNome  = iconeDoNome(texto);
  const porRotulo = Object.keys(ICONES).filter((k) => normalizar(ICONES[k][0]).includes(t));
  return [...new Set([...(peloNome ? [peloNome] : []), ...porRotulo])];
}

/** Ícones por grupo, na ordem da grade de escolha. */
export function iconesPorGrupo(): { grupo: string; chaves: string[] }[] {
  const grupos: { grupo: string; chaves: string[] }[] = [];
  for (const [chave, [, grupo]] of Object.entries(ICONES)) {
    let g = grupos.find((x) => x.grupo === grupo);
    if (!g) { g = { grupo, chaves: [] }; grupos.push(g); }
    g.chaves.push(chave);
  }
  return grupos;
}

/** Foto da embalagem vinda do Open Food Facts ou das bases irmãs (fundo branco: mostrar inteira, sem cortar). */
export const ehFotoDeEmbalagem = (url: string | null | undefined) => !!url && /open(food|products|beauty|petfood)facts\.(org|net)\//.test(url);
