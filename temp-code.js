// Substituição para o cabeçalho (linhas 344-355)
  // Adicionar cabeçalho com design moderno e logo oficial
  // ===============================================
  
  // Usar o utilitário de cabeçalho padronizado com o logo oficial da Maria Faz
  addMariaFazHeader(doc, pageWidth, brandColor);

// Substituição para o rodapé
  // Adicionar rodapé com informações de copyright e logo
  const currentPage = i + 1;
  const totalPages = doc.internal.getNumberOfPages();
  addMariaFazFooter(doc, pageWidth, (doc.internal as any).pageSize.height, 
                    t.confidential, currentPage, totalPages, t.poweredBy);