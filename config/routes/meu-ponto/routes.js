const usuario = require("../../usuario")
const usuarioADM = require("../../usuarioADM")

module.exports = (app) => {
  const prefixRota = "meu-ponto"
  const prefixModulo = app.api["meu-ponto"]

  app.route(`/${prefixRota}/token`)
    .get(app.api.token.get)

  app.route(`/${prefixRota}/empresa`)
    .all(app.config.passport.authenticate())
    .get(prefixModulo.empresa.get)

  app.route(`/${prefixRota}/entrada-usuario`)
    .all(app.config.passport.authenticate())
    .post(prefixModulo.autenticacao.entradaUsuario)

  app.route(`/${prefixRota}/validar-token-usuario`)
    .all(app.config.passport.authenticate())
    .post(prefixModulo.autenticacao.validarTokenUsuario)

  app.route(`/${prefixRota}/alterar-senha-usuario`)
    .all(app.config.passport.authenticate())
    .post(usuario(prefixModulo.autenticacao.alterarSenha))

  app.route(`/${prefixRota}/ponto`)
    .all(app.config.passport.authenticate())
    .get(usuario(prefixModulo.ponto.get))
    .post(usuario(prefixModulo.ponto.registrarPonto))


  /* ADM */
  app.route(`/${prefixRota}/adm/ponto`)
    .all(app.config.passport.authenticate())
    .get(usuarioADM(prefixModulo.ponto.getADM))
    .post(usuarioADM(prefixModulo.ponto.registrarPonto))
  app.route(`/${prefixRota}/adm/ponto/:id`)
    .all(app.config.passport.authenticate())
    .get(usuarioADM(prefixModulo.ponto.getADM))
    .put(usuarioADM(prefixModulo.ponto.saveADM))

  app.route(`/${prefixRota}/adm/funcionario`)
    .all(app.config.passport.authenticate())
    .get(usuarioADM(prefixModulo.funcionario.getADM))
    .post(usuarioADM(prefixModulo.funcionario.saveADM))
  app.route(`/${prefixRota}/adm/funcionario/:id`)
    .all(app.config.passport.authenticate())
    .get(usuarioADM(prefixModulo.funcionario.getADM))
    .put(usuarioADM(prefixModulo.funcionario.saveADM))
    .delete(usuarioADM(prefixModulo.funcionario.deleteADM))
};
