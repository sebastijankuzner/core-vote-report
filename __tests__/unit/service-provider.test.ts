import "jest-extended";

import { Application, Container } from "@arkecosystem/core-kernel";
import { ServiceProvider } from "../../src";
import { AnySchema } from "joi";

let app: Application;

const mockLogger = {
    info: jest.fn(),
};

beforeEach(() => {
    app = new Application(new Container.Container());

    app.bind(Container.Identifiers.LogService).toConstantValue(mockLogger);
});

describe("ServiceProvider", () => {
    it("shouldRegister", async () => {
        const serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
        await expect(serviceProvider.register()).toResolve();
    });

    describe("configSchema", () => {
        let serviceProvider: ServiceProvider;

        beforeEach(() => {
            jest.resetModules();
            serviceProvider = app.resolve<ServiceProvider>(ServiceProvider);
        });

        it("should validate schema using defaults", async () => {
            const result = (serviceProvider.configSchema() as AnySchema).validate(
                (await import("../../src/defaults")).defaults,
            );

            expect(result.error).toBeUndefined();

            expect(result.value.enabled).toBeTrue();
            expect(result.value.server.http.host).toEqual("0.0.0.0");
            expect(result.value.server.http.port).toEqual(4006);
        });

        describe("process.env.CORE_VOTE_REPORT_DISABLED", () => {
            it("should return true when process.env.CORE_VOTE_REPORT_DISABLED is undefined", async () => {
                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("../../src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.enabled).toBeTrue();
            });

            it("should return false when process.env.CORE_VOTE_REPORT_DISABLED is present", async () => {
                process.env.CORE_VOTE_REPORT_DISABLED = "true";

                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("../../src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.enabled).toBeFalse();
            });
        });

        describe("process.env.CORE_VOTE_REPORT_HOST", () => {
            it("should parse process.env.CORE_VOTE_REPORT_HOST", async () => {
                process.env.CORE_VOTE_REPORT_HOST = "127.0.0.1";

                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("../../src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.host).toEqual("127.0.0.1");
            });
        });

        describe("process.env.CORE_VOTE_REPORT_PORT", () => {
            it("should parse process.env.CORE_VOTE_REPORT_PORT", async () => {
                process.env.CORE_VOTE_REPORT_PORT = "4000";

                const result = (serviceProvider.configSchema() as AnySchema).validate(
                    (await import("../../src/defaults")).defaults,
                );

                expect(result.error).toBeUndefined();
                expect(result.value.server.http.port).toEqual(4000);
            });
        });

        describe("schema restrictions", () => {
            let defaults;

            beforeEach(async () => {
                defaults = (await import("../../src/defaults")).defaults
            })

            it("enabled is required && is boolean", async () => {
                defaults.enabled = 123;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"enabled" must be a boolean');

                delete defaults.enabled;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"enabled" is required');
            });

            it("server is required && is object", async () => {
                defaults.server = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" must be of type object');

                delete defaults.server;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server" is required');
            });

            it("server.http is required && is object", async () => {
                defaults.server.http = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" must be of type object');

                delete defaults.server.http;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http" is required');
            });


            it("server.http.host is required && is string", async () => {
                defaults.server.http.host = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" must be a string');

                delete defaults.server.http.host;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.host" is required');
            });

            it("server.http.port is required && is integer && is >= 1 and <= 65535", async () => {
                defaults.server.http.port = false;
                let result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be a number');

                defaults.server.http.port = 1.12;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be an integer');

                defaults.server.http.port = 0;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be greater than or equal to 1');

                defaults.server.http.port = 65536;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" must be less than or equal to 65535');

                delete defaults.server.http.port;
                result = (serviceProvider.configSchema() as AnySchema).validate(defaults);

                expect(result.error!.message).toEqual('"server.http.port" is required');
            });
        });
    });
});
