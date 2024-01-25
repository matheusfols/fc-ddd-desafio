import { Sequelize } from "sequelize-typescript";
import CustomerRepository from "../../../infrastructure/customer/repository/sequelize/customer.repository";
import Customer from "../../customer/entity/customer";
import EnviaConsoleLog1Handler from "../../customer/event/handler/EnviaConsoleLog1Handler";
import EnviaConsoleLog2Handler from "../../customer/event/handler/EnviaConsoleLog2Handler";
import Address from "../../customer/value-object/address";
import SendEmailWhenProductIsCreatedHandler from "../../product/event/handler/send-email-when-product-is-created.handler";
import ProductCreatedEvent from "../../product/event/product-created.event";
import EventDispatcher from "./event-dispatcher";
import CustomerModel from "../../../infrastructure/customer/repository/sequelize/customer.model";
import EnviaConsoleLogHandler from "../../customer/event/handler/EnviaConsoleLogHandler";
import CustomerCreatedEvent from "../../customer/event/customer-created.event";
import CustomerChangeAddressEvent from "../../customer/event/customer-change-address.event";

describe("Domain events tests", () => {
  let sequelize: Sequelize;
  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([CustomerModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should register product created event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["ProductCreatedEvent"].length).toBe(
      1
    );
    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);
  });

  it("should unregister product created event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    eventDispatcher.unregister("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["ProductCreatedEvent"].length).toBe(
      0
    );
  });

  it("should notify product created event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();
    const spyEventHandler = jest.spyOn(eventHandler, "handle");

    eventDispatcher.register("ProductCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    const productCreatedEvent = new ProductCreatedEvent({
      name: "Product 1",
      description: "Product 1 description",
      price: 10.0,
    });

    // Quando o notify for executado o SendEmailWhenProductIsCreatedHandler.handle() deve ser chamado
    eventDispatcher.notify(productCreatedEvent);

    expect(spyEventHandler).toHaveBeenCalled();
  });

  it("should register customer created event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new EnviaConsoleLog1Handler();


    eventDispatcher.register("CustomerCreatedEvent", eventHandler);

    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length).toBe(
      1
    );
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    const eventHandler2 = new EnviaConsoleLog2Handler();
    eventDispatcher.register("CustomerCreatedEvent", eventHandler2);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length).toBe(
      2
    );
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]
    ).toMatchObject(eventHandler2);

  });

  it("should notify customer created event handlers", async () => {
    const eventDispatcher = new EventDispatcher();
    const eventMessage1Handler = new EnviaConsoleLog1Handler();
    const eventMessage2Handler = new EnviaConsoleLog2Handler();

    const spy1EventHandler = jest.spyOn(eventMessage1Handler, "handle");
    const spy2EventHandler = jest.spyOn(eventMessage2Handler, "handle");


    eventDispatcher.register("CustomerCreatedEvent", eventMessage1Handler);
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]
    ).toMatchObject(eventMessage1Handler);

    eventDispatcher.register("CustomerCreatedEvent", eventMessage2Handler);
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]
    ).toMatchObject(eventMessage2Handler);

    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    customer.addRewardPoints(10);
    customer.activate();

    await customerRepository.create(customer);

    const customerCreatedEvent = new CustomerCreatedEvent(customer);


    eventDispatcher.notify(customerCreatedEvent);

    expect(spy1EventHandler).toHaveBeenCalled();
    expect(spy2EventHandler).toHaveBeenCalled();
  });

  it("should notify customer change address event handlers", async () => {
    const eventDispatcher = new EventDispatcher();
    const eventMessageHandler = new EnviaConsoleLog1Handler();
    const eventMessageChangeAddressHandler = new EnviaConsoleLogHandler();
    const spyEventHandler = jest.spyOn(eventMessageHandler, "handle");
    const spyEventChangeAddressHandler = jest.spyOn(eventMessageChangeAddressHandler, "handle");

    eventDispatcher.register("CustomerCreatedEvent", eventMessageHandler);
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]
    ).toMatchObject(eventMessageHandler);

    eventDispatcher.register("CustomerChangeAddressEvent", eventMessageChangeAddressHandler);
    expect(
      eventDispatcher.getEventHandlers["CustomerChangeAddressEvent"][0]
    ).toMatchObject(eventMessageChangeAddressHandler);


    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.Address = address;
    customer.addRewardPoints(10);
    customer.activate();

    await customerRepository.create(customer);
    const customerCreatedEvent = new CustomerCreatedEvent(customer);
    eventDispatcher.notify(customerCreatedEvent);

    const address2 = new Address("Street ", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address2)

    const customerChangeAddresEvent = new CustomerChangeAddressEvent(customer);

    eventDispatcher.notify(customerChangeAddresEvent);

    expect(spyEventHandler).toHaveBeenCalled();
    expect(spyEventChangeAddressHandler).toHaveBeenCalled();



  });

  it("should unregister all event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler = new SendEmailWhenProductIsCreatedHandler();
    const eventHandler2 = new EnviaConsoleLog1Handler();
    const eventHandler3 = new EnviaConsoleLog2Handler();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);
    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"][0]
    ).toMatchObject(eventHandler);

    eventDispatcher.register("CustomerCreatedEvent", eventHandler2);
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]
    ).toMatchObject(eventHandler2);

    eventDispatcher.register("CustomerCreatedEvent", eventHandler3);
    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]
    ).toMatchObject(eventHandler3);

    eventDispatcher.unregisterAll();

    expect(
      eventDispatcher.getEventHandlers["ProductCreatedEvent"]
    ).toBeUndefined();
  });
});
