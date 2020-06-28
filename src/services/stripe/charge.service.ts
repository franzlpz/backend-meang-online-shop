import { IPayment } from './../../interfaces/stripe/payment.interface';
import StripeApi, {
  STRIPE_OBJECTS,
  STRIPE_ACTIONS,
} from '../../lib/stripe-api';
import StripeCustomerService from './customer.service';
import StripeCardService from './card.service';

class StripeChargeService extends StripeApi {
  private async getClient(customer: string) {
    return new StripeCustomerService().get(customer);
  }
  async order(pay: IPayment) {
    // Cliente buscar info detallada
    const customerData = await this.getClient(pay.customer);
    if (customerData.status) {
      console.log('Cliente asignado correcamente');
      if (pay.token !== undefined && pay.fingerprint !== undefined) {
        console.log('Nuevos datos');
        const cardCreate = await new StripeCardService().create(
            pay.customer, pay.token, pay.fingerprint
        );
        console.log(cardCreate);
        if (!cardCreate.status) {
            return {
                status: false,
                message: 'Error tarjeta añadiendo'
            };
        }

        await new StripeCustomerService().update(pay.customer, {
            default_source: cardCreate.card
        });

      } else if (
        pay.token === undefined &&
        pay.fingerprint === undefined &&
        customerData.customer?.default_source === null
      ) {
          return {
              status: false,
              message: 'No tenemos ningún método de pago asociado, por favor proporciona la información de la tarjeta de crédito' 
          };
      }
    } else {
      console.log('No hay cliente');
      return {
        status: false,
        message:
          'El cliente seleccionado no existe y no podremos realizar pagos con esta información',
      };
    }
    pay.amount = +(Math.round(+pay.amount * 100) / 100).toFixed(2);
    pay.amount *= 100;
    console.log(pay);
    return await this.execute(
      STRIPE_OBJECTS.CHARGES,
      STRIPE_ACTIONS.CREATE,
      pay
    )
      .then((result: object) => {
        return {
          status: true,
          message: 'Pago procesardo correctamente',
          charge: result,
        };
      })
      .catch((error: Error) => this.getError(error));
  }
}

export default StripeChargeService;
