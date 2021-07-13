import { Container } from "@arkecosystem/core-kernel";

@Container.injectable()
export class Handler {
    public async handler(request, h) {
        return h.view("index", {})
    }
}
