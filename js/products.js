// Categorias válidas: "Vestidos" | "Blusas" | "Calças" | "Saias" | "Conjuntos"

const PRODUCTS = [
  {
    id: "001",
    name: "Vestido Floral Midi",
    category: "Vestidos",
    price: "R$ 189,90",
    description: "Vestido midi com estampa floral delicada. Tecido leve e fluido, ideal para dias quentes. Fechamento por zíper invisível na lateral. Caimento solto e elegante.",
    colors: [
      { label: "Rosa",       hex: "#f48fb1" },
      { label: "Branco",     hex: "#f0ede8" },
      { label: "Verde Sage", hex: "#a5c8a0" }
    ],
    sizes: ["PP", "P", "M", "G", "GG"],
    images: [
      "https://placehold.co/600x800/f5e6ef/880e4f?text=Vestido+Floral+A",
      "https://placehold.co/600x800/f5e6ef/880e4f?text=Vestido+Floral+B",
      "https://placehold.co/600x800/f5e6ef/880e4f?text=Vestido+Floral+C"
    ]
  },
  {
    id: "002",
    name: "Blusa Cropped Canelada",
    category: "Blusas",
    price: "R$ 79,90",
    description: "Blusa cropped em malha canelada, modelagem moderna e versátil. Combina com calças, saias e bermudas. Alças finas ajustáveis.",
    colors: [
      { label: "Preto",   hex: "#2d2d2d" },
      { label: "Bege",    hex: "#d4b896" },
      { label: "Lilás",   hex: "#c5a3e0" }
    ],
    sizes: ["P", "M", "G"],
    images: [
      "https://placehold.co/600x800/f0e6f8/6a1b9a?text=Blusa+Cropped+A",
      "https://placehold.co/600x800/f0e6f8/6a1b9a?text=Blusa+Cropped+B"
    ]
  },
  {
    id: "003",
    name: "Calça Wide Leg Linho",
    category: "Calças",
    price: "R$ 159,90",
    description: "Calça pantalona em linho natural, com cós elástico e bolsos laterais. Caimento largo e fluido que valoriza todas as silhuetas.",
    colors: [
      { label: "Areia",    hex: "#e8d5b7" },
      { label: "Branco",   hex: "#f0ede8" },
      { label: "Terracota",hex: "#c17c5b" }
    ],
    sizes: ["P", "M", "G", "GG"],
    images: [
      "https://placehold.co/600x800/f8ede6/8b4513?text=Calça+Wide+A",
      "https://placehold.co/600x800/f8ede6/8b4513?text=Calça+Wide+B"
    ]
  },
  {
    id: "004",
    name: "Saia Midi Plissada",
    category: "Saias",
    price: "R$ 129,90",
    description: "Saia midi com plissado elegante e cintura elástica. Tecido fluido que acompanha o movimento. Comprimento ideal para ocasiões diversas.",
    colors: [
      { label: "Rosê",     hex: "#e8b4c0" },
      { label: "Azul Céu", hex: "#87ceeb" },
      { label: "Preto",    hex: "#2d2d2d" }
    ],
    sizes: ["PP", "P", "M", "G"],
    images: [
      "https://placehold.co/600x800/fce4ec/c2185b?text=Saia+Plissada+A",
      "https://placehold.co/600x800/fce4ec/c2185b?text=Saia+Plissada+B"
    ]
  },
  {
    id: "005",
    name: "Conjunto Cropped + Calça",
    category: "Conjuntos",
    price: "R$ 219,90",
    description: "Conjunto de duas peças com blusa cropped manga curta e calça de perna reta. Tecido em viscose com toque macio. Ideal para trabalho e passeios.",
    colors: [
      { label: "Caramelo", hex: "#c49a6c" },
      { label: "Verde",    hex: "#6b9e7e" }
    ],
    sizes: ["P", "M", "G", "GG"],
    images: [
      "https://placehold.co/600x800/e8f5e9/2e7d32?text=Conjunto+A",
      "https://placehold.co/600x800/e8f5e9/2e7d32?text=Conjunto+B",
      "https://placehold.co/600x800/e8f5e9/2e7d32?text=Conjunto+C"
    ]
  },
  {
    id: "006",
    name: "Vestido Ombro a Ombro",
    category: "Vestidos",
    price: "R$ 149,90",
    description: "Vestido curto com decote ombro a ombro e elástico. Estampa listrada delicada. Perfeito para eventos casuais e noitadas.",
    colors: [
      { label: "Listrado Azul", hex: "#7eb8d4" },
      { label: "Listrado Rosa", hex: "#f4a7b9" }
    ],
    sizes: ["PP", "P", "M", "G"],
    images: [
      "https://placehold.co/600x800/e3f2fd/1565c0?text=Vestido+Ombro+A",
      "https://placehold.co/600x800/e3f2fd/1565c0?text=Vestido+Ombro+B"
    ]
  }
];
