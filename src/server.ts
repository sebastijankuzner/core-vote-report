import { Container, Contracts, Types } from "@arkecosystem/core-kernel";
import { badData } from "@hapi/boom";
import { Server as HapiServer, ServerInjectOptions, ServerInjectResponse } from "@hapi/hapi";

/**
 * @export
 * @class Server
 */
@Container.injectable()
export class Server {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof Server
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {HapiServer}
     * @memberof Server
     */
    private server: HapiServer;

    /**
     * @param {string} name
     * @param {Types.JsonObject} optionsServer
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async register(optionsServer: Types.JsonObject): Promise<void> {
        this.server = new HapiServer(this.getServerOptions(optionsServer));

        this.server.ext({
            type: "onPreHandler",
            async method(request, h) {
                request.headers["content-type"] = "application/json";

                return h.continue;
            },
        });

        await this.registerRoutes();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async boot(): Promise<void> {
        try {
            await this.server.start();

            this.logger.info(`Vote Report Server started at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to start Vote Report Server!`, error);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async dispose(): Promise<void> {
        try {
            await this.server.stop();

            this.logger.info(`Vote Report Server stopped at ${this.server.info.uri}`);
        } catch (error) {
            await this.app.terminate(`Failed to stop Vote Report Server!`, error);
        }
    }

    /**
     * @param {(string | ServerInjectOptions)} options
     * @returns {Promise<void>}
     * @memberof Server
     */
    public async inject(options: string | ServerInjectOptions): Promise<ServerInjectResponse> {
        return this.server.inject(options);
    }

    /**
     * @private
     * @param {Record<string, any>} options
     * @returns {object}
     * @memberof Server
     */
    private getServerOptions(options: Record<string, any>): object {
        options = {
            ...options.http,
            whitelist: options.whitelist,
        };

        delete options.http;
        delete options.enabled;
        delete options.whitelist;

        return {
            ...{
                router: {
                    stripTrailingSlash: true,
                },
                routes: {
                    payload: {
                        async failAction(request, h, err) {
                            return badData(err.message);
                        },
                    },
                    validate: {
                        async failAction(request, h, err) {
                            return badData(err.message);
                        },
                    },
                },
            },
            ...options,
        };
    }

    /**
     * @private
     * @returns {void}
     * @memberof Server
     */
    private registerRoutes(): void {
        this.server.route({
            method: "GET",
            path: "/",
            handler() {
                return { data: "Hello World!" };
            },
        });
    }
}
