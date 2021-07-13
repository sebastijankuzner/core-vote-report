import { Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {}

    public async boot(): Promise<void> {}

    public async dispose(): Promise<void> {}

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
