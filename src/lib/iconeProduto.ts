/*
 * Ícone do produto pelo nome (EQZ-30). Ícones: Microsoft Fluent Emoji 3D (licença MIT, crédito em
 * /licencas), convertidos para WebP 128 px em public/icones/produtos/<chave>.webp.
 * Ordem da imagem no app: foto (da pessoa ou da embalagem) → ícone escolhido à mão (products.icon)
 * → ícone pelo nome → iniciais. "nenhum" em products.icon força as iniciais.
 * O dicionário e o algoritmo vêm da prévia aprovada pelo João em 2026-10-17.
 */

export const SEM_ICONE = "nenhum";

/* Nome em português e grupo de cada ícone (a ordem é a da grade de escolha) */
export const ICONES: Record<string, [string, string]> = {
  cerveja: ["Cerveja", "Bebidas"], espumante: ["Espumante", "Bebidas"], vinho: ["Vinho", "Bebidas"], destilado: ["Destilado", "Bebidas"],
  drink: ["Drink", "Bebidas"], refri: ["Refrigerante", "Bebidas"], gelo: ["Gelo", "Bebidas"], agua: ["Água", "Bebidas"],
  suco: ["Suco", "Bebidas"], cafe: ["Café", "Bebidas"], limao: ["Limão", "Bebidas"],
  queijo: ["Queijo", "Comida"], carne: ["Carne", "Comida"], frango: ["Frango", "Comida"], bacon: ["Bacon", "Comida"],
  arroz: ["Arroz", "Comida"], ovo: ["Ovo", "Comida"], tomate: ["Tomate", "Comida"], cebola: ["Cebola", "Comida"],
  alho: ["Alho", "Comida"], batata: ["Batata", "Comida"], cenoura: ["Cenoura", "Comida"], folhas: ["Verduras", "Comida"],
  pao: ["Pão", "Comida"], baguete: ["Baguete", "Comida"], manteiga: ["Manteiga", "Comida"], leite: ["Leite", "Comida"],
  macarrao: ["Massa", "Comida"], bolo: ["Bolo", "Comida"], docinho: ["Doce", "Comida"], chocolate: ["Chocolate", "Comida"],
  enlatado: ["Enlatado", "Comida"], pimenta: ["Pimenta", "Comida"], azeitona: ["Azeitona", "Comida"], mel: ["Mel", "Comida"],
  camarao: ["Camarão", "Comida"], peixe: ["Peixe", "Comida"], pizza: ["Pizza", "Comida"], hamburguer: ["Hambúrguer", "Comida"],
  salsicha: ["Salsicha", "Comida"], fritas: ["Fritas", "Comida"], sal: ["Sal", "Comida"],
  camiseta: ["Camiseta", "Roupas"], blusa: ["Blusa", "Roupas"], calca: ["Calça", "Roupas"], vestido: ["Vestido", "Roupas"],
  short: ["Bermuda", "Roupas"], camisa: ["Camisa social", "Roupas"], casaco: ["Casaco", "Roupas"], meia: ["Meia", "Roupas"],
  tenis: ["Tênis", "Roupas"], salto: ["Salto", "Roupas"], sandalia: ["Sandália", "Roupas"], chinelo: ["Chinelo", "Roupas"],
  bone: ["Boné", "Roupas"], bolsa: ["Bolsa", "Roupas"], biquini: ["Biquíni", "Roupas"], cueca: ["Íntima", "Roupas"],
  bota: ["Bota", "Roupas"], cachecol: ["Cachecol", "Roupas"],
  cachorro: ["Cachorro", "Pet"], gato: ["Gato", "Pet"], osso: ["Petisco", "Pet"], pet: ["Acessório pet", "Pet"],
  sabao: ["Sabão", "Limpeza"], frasco: ["Frasco", "Limpeza"], esponja: ["Esponja", "Limpeza"], papel: ["Papel", "Limpeza"],
  vassoura: ["Vassoura", "Limpeza"], balde: ["Balde", "Limpeza"],
  chave: ["Chave", "Oficina"], parafuso: ["Parafuso", "Oficina"], martelo: ["Martelo", "Oficina"], oleo: ["Óleo de motor", "Oficina"],
  pneu: ["Pneu", "Oficina"], lampada: ["Lâmpada", "Oficina"], fenda: ["Chave de fenda", "Oficina"],
  batom: ["Maquiagem", "Outros"], caixa: ["Caixa", "Outros"], sacola: ["Sacola", "Outros"],
};

export const urlIcone = (chave: string) => `/icones/produtos/${chave}.webp`;

/* Expressões de mais de uma palavra, testadas antes das palavras soltas */
const EXPRESSOES: [string, string][] = [
  ["chave de fenda", "fenda"], ["batata frita", "fritas"], ["batata palito", "fritas"], ["cachorro quente", "salsicha"],
  ["leite condensado", "enlatado"], ["creme de leite", "leite"], ["molho de tomate", "tomate"], ["extrato de tomate", "tomate"],
  ["agua sanitaria", "frasco"], ["papel higienico", "papel"], ["papel toalha", "papel"], ["palha de aco", "esponja"],
  ["file de frango", "frango"], ["peito de frango", "frango"], ["file de peixe", "peixe"], ["file de tilapia", "peixe"],
  ["oleo de soja", "frasco"], ["oleo de girassol", "frasco"], ["oleo de canola", "frasco"], ["oleo de cozinha", "frasco"],
  ["camisa social", "camisa"], ["pao de queijo", "pao"], ["oleo de motor", "oleo"], ["areia sanitaria", "gato"],
];

/* Palavras que decidem o ícone */
const FORTES: Record<string, string> = {
  cerveja: "cerveja chopp chope heineken skol brahma budweiser amstel itaipava stella corona spaten",
  espumante: "espumante champanhe champagne prosecco sidra", vinho: "vinho",
  destilado: "whisky uisque vodka cachaca pinga gin rum tequila conhaque licor destilado campari",
  drink: "drink caipirinha coquetel aperol martini",
  refri: "refrigerante refri coca cocacola guarana fanta sprite pepsi soda tonica schweppes kuat",
  gelo: "gelo", agua: "agua", suco: "suco nectar", cafe: "cafe capuccino cappuccino expresso", limao: "limao lima",
  queijo: "queijo mussarela mucarela mozarela mozzarella parmesao provolone cheddar requeijao catupiry gorgonzola ricota",
  carne: "carne picanha alcatra patinho acem contrafile maminha fraldinha costela cupim file moida bovina lombo",
  frango: "frango coxa sobrecoxa galinha chester peru", bacon: "bacon toucinho pancetta presunto",
  arroz: "arroz", ovo: "ovo", tomate: "tomate ketchup", cebola: "cebola", alho: "alho", batata: "batata mandioca aipim inhame",
  cenoura: "cenoura", folhas: "alface rucula couve espinafre agriao salsinha cebolinha manjericao coentro hortela verdura oregano",
  pao: "pao bisnaga torrada brioche", baguete: "baguete", manteiga: "manteiga margarina", leite: "leite iogurte nata",
  macarrao: "macarrao espaguete lasanha penne talharim nhoque", bolo: "bolo torta",
  docinho: "doce brigadeiro beijinho cupcake confeito granulado", chocolate: "chocolate cacau achocolatado nescau bombom",
  enlatado: "milho ervilha atum sardinha enlatado conserva palmito seleta", pimenta: "pimenta paprica tempero",
  azeitona: "azeitona azeite", mel: "mel", camarao: "camarao", peixe: "peixe tilapia salmao bacalhau merluza",
  pizza: "pizza", hamburguer: "hamburguer burger blend", salsicha: "salsicha linguica calabresa hotdog", fritas: "fritas", sal: "sal",
  camiseta: "camiseta regata camisetao tshirt polo", blusa: "blusa cropped body", calca: "calca jeans legging jogger",
  vestido: "vestido saia", short: "short bermuda", camisa: "camisa gravata", casaco: "casaco jaqueta moletom blazer sueter cardigan colete",
  meia: "meia meiao", tenis: "tenis sneaker", salto: "salto scarpin", sandalia: "sandalia rasteirinha tamanco",
  chinelo: "chinelo havaianas slide", bone: "bone chapeu viseira gorro", bolsa: "bolsa mochila carteira necessaire pochete",
  biquini: "biquini maio sunga", cueca: "cueca calcinha sutia lingerie", bota: "bota coturno", cachecol: "cachecol echarpe",
  cachorro: "cachorro cao caes dog filhote", gato: "gato felino", osso: "osso petisco bifinho", pet: "coleira peitoral",
  sabao: "sabao sabonete detergente amaciante", frasco: "shampoo xampu condicionador hidratante alcool desinfetante multiuso",
  esponja: "esponja bucha", papel: "papel guardanapo", vassoura: "vassoura rodo", balde: "balde",
  chave: "chave alicate", parafuso: "parafuso porca arruela prego rebite", martelo: "martelo", oleo: "oleo lubrificante",
  pneu: "pneu roda camara", lampada: "lampada led farol", fenda: "philips",
  batom: "batom gloss maquiagem esmalte rimel", sacola: "sacola sacolinha saco",
};

/* Palavras genéricas: só valem se nenhuma palavra forte aparecer no nome ("ração" do gato é gato) */
const FRACAS: Record<string, string> = {
  cachorro: "racao", caixa: "caixa embalagem kit", frasco: "creme gel", blusa: "top", tomate: "molho", macarrao: "massa",
};

function paraMapa(src: Record<string, string>): Map<string, string> {
  const m = new Map<string, string>();
  for (const [chave, palavras] of Object.entries(src)) for (const p of palavras.split(" ")) m.set(p, chave);
  return m;
}
const FORTES_M = paraMapa(FORTES);
const FRACAS_M = paraMapa(FRACAS);

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

/** Chave do ícone que combina com o nome do produto, ou null (ficam as iniciais). */
export function iconeDoNome(nome: string): string | null {
  const n = normalizar(nome);
  const comEspacos = ` ${n} `;
  for (const [expr, chave] of EXPRESSOES) if (comEspacos.includes(` ${expr} `)) return chave;

  let fraca: string | null = null;
  for (const palavra of n.split(" ")) {
    for (const v of variantes(palavra)) {
      const forte = FORTES_M.get(v);
      if (forte) return forte;
      if (!fraca) fraca = FRACAS_M.get(v) ?? null;
    }
  }
  return fraca;
}

/** Ícone a mostrar: o escolhido à mão (se existir), senão o do nome. null = iniciais. */
export function iconeDoProduto(nome: string, escolhido?: string | null): string | null {
  if (escolhido === SEM_ICONE) return null;
  if (escolhido && ICONES[escolhido]) return escolhido;
  return iconeDoNome(nome);
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

/** Foto da embalagem vinda do Open Food Facts (fundo branco: mostrar inteira, sem cortar). */
export const ehFotoDeEmbalagem = (url: string | null | undefined) => !!url && /openfoodfacts\.(org|net)\//.test(url);
