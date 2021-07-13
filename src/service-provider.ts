import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { DappManager } from "./manager";
import Joi from "joi";

const DappManagerIdentifier = Symbol.for("DappManager");

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService).info(`Loading dapp`);

        this.app.bind<DappManager>(DappManagerIdentifier).to(DappManager).inSingletonScope();
    }

    public async boot(): Promise<void> {
        this.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService).info(`Booting dapp`);

        this.app.get<DappManager>(DappManagerIdentifier).start({});
    }

    public async dispose(): Promise<void> {
        this.app.get<Contracts.Kernel.Logger>(Container.Identifiers.LogService).info(`Disposing dapp`);

        this.app.get<DappManager>(DappManagerIdentifier).stop();
    }

    public configSchema(): object {
        return Joi.object({
            enabled: Joi.bool().required(),
            server: Joi.object({
                http: Joi.object({
                    host: Joi.string().required(),
                    port: Joi.number().integer().min(1).max(65535).required(),
                }).required(),
            }).required(),
        });
    }
}
