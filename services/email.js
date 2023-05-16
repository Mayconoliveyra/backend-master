const nodemailer = require('nodemailer');

module.exports = (app) => {
    const { utility_console, existOrError } = app.api.utilities;

    const sendEmail = async ({ email, title, body, template = false }) => {
        try {
            const { email_host, email_port, email_secure, email_user, email_pass, nome } = app.store
            const modelo = {
                email: email,
                title: title,
                body: body,
                template: template,
            }

            existOrError(email, "[email] não pode ser nulo.")
            if (!template) {
                existOrError(title, "[title] não pode ser nulo.")
                existOrError(body, "[body] não pode ser nulo.")
            }

            const transporter = nodemailer.createTransport({
                host: email_host,
                port: email_port,
                secure: email_secure,
                auth: {
                    user: email_user,
                    pass: email_pass
                }
            })

            const emailSend = {
                from: `"${nome} " <${email_user}>`,
                to: modelo.email,
                subject: modelo.title,
                html: modelo.body
            }

            switch (modelo.template) {
                case 'AUTHENTICATION':
                    emailSend.subject = "Ativação de usuário";
                    emailSend.html = AUTHENTICATION(modelo);
                    break;
                case 'RECOVER':
                    emailSend.subject = "Assistência de senha";
                    emailSend.html = RECOVER(modelo);
                    break;
                default:
                    break;
            }

            transporter.sendMail(emailSend)
                .then()
                .catch(error => utility_console("email.sendEmail", error))
        } catch (error) {
            utility_console("email.sendEmail", error)
        }
    }
    const AUTHENTICATION = (modelo) => {
        const { url_site, url_logo, a_email } = app.store
        return `
    <div style='text-align: center;'>
        <thead style='text-align: center;'>
        <img
            src=${url_logo}
            alt='logo_store'
            width='180px'
        />
        <hr />
        <h4>Olá, seja muito bem-vindo! <br>
        Falta pouco para você ativar sua conta</h4>
        <p>
            Clique no link abaixo para finalizar o processo de cadastro:
        </p>
        <b>
            <a href='${url_site}/conta/cadastrarsenha?authlogin=${modelo.body}'>Finalizar meu cadastro</a>
        </b>
        <br>
        <br>
        <br>
        <h4 style='margin-bottom: 5px;'>Atenção!</h4>
        <small>
            Se você não realizou esta solicitação, por favor ignore esta mensagem.
        </small>
        <br>
        <small>
            Caso tenha dúvidas, nos envie uma mensagem: <a href=mailto:${a_email}>${a_email}</a>
        </small>
        </thead>
    </div>
    `
    }
    const RECOVER = (modelo) => {
        const { url_site, url_logo, a_email } = app.store
        return `
    <div style='text-align: center;'>
        <thead style='text-align: center;'>
        <img
            src=${url_logo}
            alt='minha logo'
            width='180px'
        />
        <hr />
        <h4>Assistência de senha</h4>
        <p>
            Clique no link abaixo para restaurar sua senha:
        </p>
        <b>
            <a href='${url_site}/conta/cadastrarsenha?authlogin=${modelo.body}'>Recuperar minha senha</a>
        </b>
        <br>
        <br>
        <br>
        <h4 style='margin-bottom: 5px;'>Atenção!</h4>
        <small>
            Se você não realizou esta solicitação, por favor ignore esta mensagem.
        </small>
        <br>
        <small>
            Caso tenha dúvidas, nos envie uma mensagem: <a href=mailto:${a_email}>${a_email}</a>
        </small>
        </thead>
    </div>
    `
    }
    return { sendEmail };
};
