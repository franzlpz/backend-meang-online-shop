import { findOneElement } from './../../lib/db-operations';
import { EXPIRETIME, MESSAGES, COLLECTIONS } from './../../config/constants';
import { IResolvers } from 'graphql-tools';
import { transport } from '../../config/mailer';
import JWT from '../../lib/jwt';
import UsersService from '../../services/users.service';

const resolversMailMutation: IResolvers = {
  Mutation: {
    async sendEmail(_, { mail }) {
        console.log(mail);
      return new Promise((resolve, reject) => {
        transport.sendMail({
            from: '"🕹️ Gamezonia Online Shop 🕹️" <gamezonia.online.shop@gmail.com>', // sender address
            to: mail.to, // list of receivers
            subject: mail.subject, // Subject line
            html: mail.html, // html body
          }, (error, _) => {
              (error) ? reject({
                  status: false,
                  message: error
              }) : resolve({
                  status: true,
                  message: 'Email correctamente enviado a ' + mail.to,
                  mail
              });
          });
      });
    },
    async activeUserEmail(_, { id, email }) {
      const token = new JWT().sign({user: {id, email}}, EXPIRETIME.H1);
      const html = `Para activar la cuenta haz click sobre esto: <a href="${process.env.CLIENT_URL}/#/active/${token}">Clic aquí</a>`;
      return new Promise((resolve, reject) => {
        transport.sendMail({
            from: '"🕹️ Gamezonia Online Shop 🕹️" <gamezonia.online.shop@gmail.com>', // sender address
            to: email, // list of receivers
            subject: 'Activar usuario', // Subject line
            html
          }, (error, _) => {
              (error) ? reject({
                  status: false,
                  message: error
              }) : resolve({
                  status: true,
                  message: 'Email correctamente enviado a ' + email
              });
          });
      });
    },
    async activeUserAction(_, { id, birthday, password }, {token, db}) {
      // verificar el token
      const checkToken = new JWT().verify(token);
      if (checkToken === MESSAGES.TOKEN_VERICATION_FAILED) {
        return {
          status: false,
          message: 'El periodo para activar el usuario ha finalizado. Contacta con el administrador para más información.',
        };
      }
      // Si el token es valido , asignamos la información al usuario
      const user = Object.values(checkToken)[0];
      console.log(user, { id, birthday, password });
      if (user.id !== id) {
        return {
          status: false,
          message: 'El usuario del token no corresponde al añadido en el argumento'
        };
      }
      /*return {
        status: true,
        message: 'Preparado para activar el usuario'
      };*/
      return new UsersService(_, { id, user: { birthday, password } }, {token, db}).unblock(true);
    },
    async resetPassword(_, {email}, {db}) {
      // Coger información del usuario
      const user = await findOneElement(db, COLLECTIONS.USERS, { email});
      // Si usuario es indefinido mandamos un mensaje que no existe el usuario
      if (user === undefined || user === null) {
        return {
          status: false,
          message: `Usuario con el email ${email} no existe`
        };
      }
      const newUser = {
        id: user.id,
        email
      };
      const token = new JWT().sign({user: newUser}, EXPIRETIME.M15);
      const html = `Para cambiar de contraseña haz click sobre esto: <a href="${process.env.CLIENT_URL}/#/reset/${token}">Clic aquí</a>`;
      return new Promise((resolve, reject) => {
        transport.sendMail({
            from: '"🕹️ Gamezonia Online Shop 🕹️" <gamezonia.online.shop@gmail.com>', // sender address
            to: email, // list of receivers
            subject: 'Petición para cambiar de contraseña', // Subject line
            html
          }, (error, _) => {
              (error) ? reject({
                  status: false,
                  message: error
              }) : resolve({
                  status: true,
                  message: 'Email correctamente enviado a ' + email
              });
          });
      });
    }
  },
};

export default resolversMailMutation;