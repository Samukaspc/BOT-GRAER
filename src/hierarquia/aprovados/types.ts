export type LinhaAprovadoComunicado = {
  idUsuario: string;
  idsCargos: readonly string[];
};

export type ParametrosMontarComunicadoAprovados = {
  linhas: readonly LinhaAprovadoComunicado[];
};
