//dados
const CATEGORIAS = ["camiseta", "calca", "calcado"];

const MENSAGENS_VAZIO = {
  camiseta: "Nenhuma camiseta adicionada ainda.",
  calca: "Nenhuma calça adicionada ainda.",
  calcado: "Nenhum calçado adicionado ainda."
};

let pecas = [];        // todas as peças cadastradas
let look = {};         // look atual: { camiseta: idDaPeca, calca: idDaPeca, ... }
let looksSalvos = [];  // looks que o usuário salvou
let filtroAtual = "todas";

// elementos da página - acha e reutiliza
const formPeca = document.querySelector("#form-peca");
const inputNome = document.querySelector("#nome-peca");
const inputCategoria = document.querySelector("#categoria-peca");
const inputImagem = document.querySelector("#imagem-peca");

const botoesFiltro = document.querySelectorAll(".filtro");

const inputNomeLook = document.querySelector("#nome-look");
const botaoSalvarLook = document.querySelector("#btn-salvar-look");
const botaoLimparLook = document.querySelector("#btn-limpar-look");
const listaLooks = document.querySelector("#lista-looks");

//funções úteis

// cria o objeto de uma peça (com um id único)
function criarPeca(nome, imagem, categoria) {
  const novaPeca = {
    id: Date.now(),
    nome: nome,
    imagem: imagem,
    categoria: categoria
  };
  return novaPeca;
}

//mostra quantas peças existem na lista
function contarPecas(lista) {
  return lista.length;
}

//procura peça pelo id (devolve undefined se não achar)
function buscarPeca(id) {
  return pecas.find(function (peca) {
    return peca.id === id;
  });
}

//cria um parágrafo de "vazio"
function criarAvisoVazio(texto) {
  const aviso = document.createElement("p");
  aviso.classList.add("vazio");
  aviso.textContent = texto;
  return aviso;
}

//salvar e carregar (localStorage)
//  localStorage só guarda texto. Por isso usamos JSON:
//    JSON.stringify: transforma array/objeto em texto
//    JSON.parse: transforma o texto de volta em array/objeto

function salvarDados() {
  try {
    localStorage.setItem("pecas", JSON.stringify(pecas));
    localStorage.setItem("look", JSON.stringify(look));
    localStorage.setItem("looksSalvos", JSON.stringify(looksSalvos));
    return true;
  } catch (erro) {
    alert("Não foi possível salvar: o armazenamento do navegador está cheio. Remova alguma peça e tente de novo.");
    return false;
  }
}

function carregarDados() {
  try {
    pecas = JSON.parse(localStorage.getItem("pecas")) || [];
    look = JSON.parse(localStorage.getItem("look")) || {};
    looksSalvos = JSON.parse(localStorage.getItem("looksSalvos")) || [];
  } catch (erro) {
    pecas = [];
    look = {};
    looksSalvos = [];
  }
}


//imagens — ler o arquivo e diminuir o tamanho
function reduzirImagem(dataUrl, depois) {
  const imagem = new Image();

  imagem.onload = function () {
    const MAXIMO = 500;
    let largura = imagem.width;
    let altura = imagem.height;

    if (largura > MAXIMO || altura > MAXIMO) {
      const escala = MAXIMO / Math.max(largura, altura);
      largura = Math.round(largura * escala);
      altura = Math.round(altura * escala);
    }

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");
    contexto.fillStyle = "#ffffff"; // fundo branco (PNG transparente vira branco)
    contexto.fillRect(0, 0, largura, altura);
    contexto.drawImage(imagem, 0, 0, largura, altura);

    depois(canvas.toDataURL("image/jpeg", 0.8));
  };

  // Se não conseguir reduzir, usa a imagem original mesmo
  imagem.onerror = function () {
    depois(dataUrl);
  };

  imagem.src = dataUrl;
}


// mudar tela

function atualizarTela() {
  mostrarCatalogo();
  mostrarLook();
  mostrarLooksSalvos();
  aplicarFiltro();
}

//catalogo
function criarCartao(peca) {
  const estaNoLook = look[peca.categoria] === peca.id;

  const cartao = document.createElement("div");
  cartao.classList.add("item");
  if (estaNoLook) {
    cartao.classList.add("no-look");
  }

  const imagem = document.createElement("img");
  imagem.src = peca.imagem;
  imagem.alt = peca.nome;

  const titulo = document.createElement("h3");
  titulo.textContent = peca.nome;

  const acoes = document.createElement("div");
  acoes.classList.add("item-acoes");

  const botaoLook = document.createElement("button");
  botaoLook.type = "button";
  if (estaNoLook) {
    botaoLook.textContent = "Tirar do look";
    botaoLook.classList.add("secundario");
  } else {
    botaoLook.textContent = "Adicionar ao look";
  }
  botaoLook.addEventListener("click", function () {
    alternarNoLook(peca);
  });

  const botaoRemover = document.createElement("button");
  botaoRemover.type = "button";
  botaoRemover.textContent = "Remover peça";
  botaoRemover.classList.add("perigo");
  botaoRemover.addEventListener("click", function () {
    removerPeca(peca.id);
  });

  acoes.appendChild(botaoLook);
  acoes.appendChild(botaoRemover);

  cartao.appendChild(imagem);
  cartao.appendChild(titulo);
  cartao.appendChild(acoes);

  return cartao;
}

function mostrarCatalogo() {
  document.querySelector("#contador").textContent = contarPecas(pecas);

  CATEGORIAS.forEach(function (categoria) {
    const linha = document.querySelector('[data-categoria="' + categoria + '"] .itens');
    linha.innerHTML = ""; // limpa a fileira antes de redesenhar

    const pecasDaCategoria = pecas.filter(function (peca) {
      return peca.categoria === categoria;
    });

    if (pecasDaCategoria.length === 0) {
      linha.appendChild(criarAvisoVazio(MENSAGENS_VAZIO[categoria]));
    }

    pecasDaCategoria.forEach(function (peca) {
      linha.appendChild(criarCartao(peca));
    });
  });
}

// look atual
function mostrarLook() {
  CATEGORIAS.forEach(function (categoria) {
    const conteudo = document.querySelector('[data-slot="' + categoria + '"] .slot-conteudo');
    conteudo.innerHTML = "";

    const peca = buscarPeca(look[categoria]);

    if (!peca) {
      conteudo.appendChild(criarAvisoVazio("Nenhuma peça escolhida."));
      return; // vai para a próxima categoria
    }

    const linha = document.createElement("div");
    linha.classList.add("peca-look");

    const imagem = document.createElement("img");
    imagem.src = peca.imagem;
    imagem.alt = peca.nome;

    const nome = document.createElement("span");
    nome.textContent = peca.nome;

    const botaoTirar = document.createElement("button");
    botaoTirar.type = "button";
    botaoTirar.textContent = "Tirar";
    botaoTirar.classList.add("secundario");
    botaoTirar.addEventListener("click", function () {
      look[categoria] = null;
      salvarDados();
      atualizarTela();
    });

    linha.appendChild(imagem);
    linha.appendChild(nome);
    linha.appendChild(botaoTirar);
    conteudo.appendChild(linha);
  });
}

// look salvo
function mostrarLooksSalvos() {
  listaLooks.innerHTML = "";

  if (looksSalvos.length === 0) {
    listaLooks.appendChild(criarAvisoVazio("Nenhum look salvo ainda."));
    return;
  }

  looksSalvos.forEach(function (lookSalvo) {
    const cartao = document.createElement("div");
    cartao.classList.add("look-salvo");

    const titulo = document.createElement("h3");
    titulo.textContent = lookSalvo.nome;

    const fotos = document.createElement("div");
    fotos.classList.add("look-salvo-pecas");

    CATEGORIAS.forEach(function (categoria) {
      const peca = buscarPeca(lookSalvo.itens[categoria]);
      if (peca) {
        const imagem = document.createElement("img");
        imagem.src = peca.imagem;
        imagem.alt = peca.nome;
        fotos.appendChild(imagem);
      }
    });

    if (fotos.children.length === 0) {
      fotos.appendChild(criarAvisoVazio("As peças deste look foram removidas."));
    }

    const acoes = document.createElement("div");
    acoes.classList.add("look-salvo-acoes");

    const botaoUsar = document.createElement("button");
    botaoUsar.type = "button";
    botaoUsar.textContent = "Usar este look";
    botaoUsar.addEventListener("click", function () {
      carregarLook(lookSalvo.id);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.type = "button";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.classList.add("perigo");
    botaoExcluir.addEventListener("click", function () {
      excluirLook(lookSalvo.id);
    });

    acoes.appendChild(botaoUsar);
    acoes.appendChild(botaoExcluir);

    cartao.appendChild(titulo);
    cartao.appendChild(fotos);
    cartao.appendChild(acoes);
    listaLooks.appendChild(cartao);
  });
}

//filtro
function aplicarFiltro() {
  const linhas = document.querySelectorAll(".linha-categoria");

  linhas.forEach(function (linha) {
    // dataset.categoria lê o atributo data-categoria do HTML
    if (filtroAtual === "todas" || linha.dataset.categoria === filtroAtual) {
      linha.classList.remove("oculto");
    } else {
      linha.classList.add("oculto");
    }
  });

  botoesFiltro.forEach(function (botao) {
    if (botao.dataset.filtro === filtroAtual) {
      botao.classList.add("ativo");
    } else {
      botao.classList.remove("ativo");
    }
  });
}

// ações

// Adiciona ao look. Se já existir outra peça da mesma categoria, ela é
// substituída. Se clicar na peça que já está no look, ela sai.
function alternarNoLook(peca) {
  if (look[peca.categoria] === peca.id) {
    look[peca.categoria] = null;
  } else {
    look[peca.categoria] = peca.id;
  }
  salvarDados();
  atualizarTela();
}

function removerPeca(id) {
  if (!confirm("Remover esta peça do catálogo?")) {
    return;
  }

  pecas = pecas.filter(function (peca) {
    return peca.id !== id;
  });

  // tira a peça do look atual e dos looks salvos
  CATEGORIAS.forEach(function (categoria) {
    if (look[categoria] === id) {
      look[categoria] = null;
    }
    looksSalvos.forEach(function (lookSalvo) {
      if (lookSalvo.itens[categoria] === id) {
        delete lookSalvo.itens[categoria];
      }
    });
  });

  salvarDados();
  atualizarTela();
}

function salvarLookAtual() {
  const itens = {};
  let total = 0;

  CATEGORIAS.forEach(function (categoria) {
    if (buscarPeca(look[categoria])) {
      itens[categoria] = look[categoria];
      total++;
    }
  });

  if (total === 0) {
    alert("Adicione pelo menos uma peça ao look antes de salvar.");
    return;
  }

  let nome = inputNomeLook.value.trim();
  if (nome === "") {
    nome = "Look " + (looksSalvos.length + 1);
  }

  looksSalvos.push({ id: Date.now(), nome: nome, itens: itens });
  inputNomeLook.value = "";

  salvarDados();
  atualizarTela();
}

function carregarLook(id) {
  const lookSalvo = looksSalvos.find(function (item) {
    return item.id === id;
  });
  if (!lookSalvo) {
    return;
  }

  look = {};
  CATEGORIAS.forEach(function (categoria) {
    if (buscarPeca(lookSalvo.itens[categoria])) {
      look[categoria] = lookSalvo.itens[categoria];
    }
  });

  salvarDados();
  atualizarTela();
}

function excluirLook(id) {
  if (!confirm("Excluir este look salvo?")) {
    return;
  }

  looksSalvos = looksSalvos.filter(function (item) {
    return item.id !== id;
  });

  salvarDados();
  atualizarTela();
}

function limparLook() {
  look = {};
  salvarDados();
  atualizarTela();
}

// eventos

// Enviar o formulário 
formPeca.addEventListener("submit", function (evento) {
  evento.preventDefault(); // impede a página de recarregar

  const nome = inputNome.value.trim();
  const categoria = inputCategoria.value;
  const arquivo = inputImagem.files[0];

  if (nome === "" || !arquivo) {
    alert("Digite o nome da peça e escolha uma imagem.");
    return;
  }

  const leitor = new FileReader();
  leitor.onload = function () {
    reduzirImagem(leitor.result, function (imagemFinal) {
      const peca = criarPeca(nome, imagemFinal, categoria);
      pecas.push(peca);

      if (!salvarDados()) {
        pecas.pop(); // não coube no armazenamento: desfaz
        return;
      }

      atualizarTela();
      formPeca.reset();
    });
  };
  leitor.readAsDataURL(arquivo);
});

// Filtros
botoesFiltro.forEach(function (botao) {
  botao.addEventListener("click", function () {
    filtroAtual = botao.dataset.filtro;
    aplicarFiltro();
  });
});

// Look
botaoSalvarLook.addEventListener("click", salvarLookAtual);
botaoLimparLook.addEventListener("click", limparLook);

// inicio
carregarDados();
atualizarTela();