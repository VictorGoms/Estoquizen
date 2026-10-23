import { describe, it, expect } from "vitest";
import { lerProdutoAberto, ehFotoDeBaseAberta } from "./codigoBarras";

describe("bases abertas de código de barras (EQZ-53)", () => {
  it("lê o nome e a foto da resposta do Open Food Facts e das irmãs", () => {
    expect(lerProdutoAberto({
      status: 1,
      product: { product_name: "  Refrigerante Coca-Cola 2Lt ", image_front_url: "https://images.openfoodfacts.org/images/products/789/front.jpg" },
    })).toEqual({ nome: "Refrigerante Coca-Cola 2Lt", foto: "https://images.openfoodfacts.org/images/products/789/front.jpg" });

    expect(lerProdutoAberto({
      status: 1,
      product: { product_name: "", product_name_pt: "Carvão para narguilé", image_url: "https://images.openproductsfacts.org/x.jpg" },
    })).toEqual({ nome: "Carvão para narguilé", foto: "https://images.openproductsfacts.org/x.jpg" });
  });

  it("código desconhecido ou sem nome nem foto não sugere nada", () => {
    expect(lerProdutoAberto({ status: 0 })).toBeNull();
    expect(lerProdutoAberto({ status: 1, product: { product_name: " " } })).toBeNull();
    expect(lerProdutoAberto(null)).toBeNull();
  });

  it("só aceita foto dos servidores de imagem das bases abertas", () => {
    expect(ehFotoDeBaseAberta("https://images.openbeautyfacts.org/a.jpg")).toBe(true);
    expect(ehFotoDeBaseAberta("https://images.openpetfoodfacts.org/a.jpg")).toBe(true);
    expect(ehFotoDeBaseAberta("http://images.openfoodfacts.org/a.jpg")).toBe(false);
    expect(ehFotoDeBaseAberta("https://images.openfoodfacts.org.golpe.com/a.jpg")).toBe(false);
    expect(lerProdutoAberto({ status: 1, product: { product_name: "X", image_url: "https://golpe.com/a.jpg" } })?.foto).toBeNull();
  });
});
