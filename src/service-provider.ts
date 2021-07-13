import { Providers, Types } from "@arkecosystem/core-kernel";
import Joi from "joi";
import { Identifiers } from "./identifiers";
import { Server } from "./server";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        this.app.bind(Identifiers.Server).to(Server).inSingletonScope();

        await this.app.get<Server>(Identifiers.Server).register(this.config().get<Types.JsonObject>("server")!);
    }

    public async boot(): Promise<void> {
        await this.app.get<Server>(Identifiers.Server).boot();
    }

    public async dispose(): Promise<void> {
        await this.app.get<Server>(Identifiers.Server).dispose();
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
