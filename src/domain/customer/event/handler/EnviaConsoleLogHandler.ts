import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import CustomerChangeAddressEvent from "../customer-change-address.event";


export default class EnviaConsoleLogHandler
  implements EventHandlerInterface<CustomerChangeAddressEvent>
{
  handle(event: CustomerChangeAddressEvent): void {
    const address = `${event.eventData.Address.street}, ${event.eventData.Address.number}, ${event.eventData.Address.zip}, ${event.eventData.Address.city}`
    console.log(`Endereço do cliente ${event.eventData.id}, ${event.eventData.name} foi alterado para: ${address}`);
  }
}
