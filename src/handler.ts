import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";

@Container.injectable()
export class Handler {
    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async handler(request, h) {
        const lastBlock: Interfaces.IBlock = this.blockchain.getLastBlock();
        const { maxDelegates } = Utils.roundCalculator.calculateRound(lastBlock.data.height);

        const supply: Utils.BigNumber = Utils.BigNumber.make(Utils.supplyCalculator.calculate(lastBlock.data.height));

        const delegates = [...this.walletRepository.allByUsername()].sort((a, b) => {
            return a.getAttribute<number>("delegate.rank", 0) - b.getAttribute<number>("delegate.rank", 0);
        });


        const activeDelegates = delegates.slice(0, maxDelegates);
        const standbyDelegates = delegates.slice(maxDelegates, 100); // TODO: take from config

        const voters = this.walletRepository
            .allByPublicKey()
            .filter((wallet) => wallet.hasVoted() && wallet.getBalance().isGreaterThan(0.1 * 1e8));

        const totalVotes = voters
            .map((wallet) => wallet.getBalance())
            .reduce((a: Utils.BigNumber, b: Utils.BigNumber) => a.plus(b), Utils.BigNumber.ZERO);

        const client: {
            token: string;
            symbol: string;
            explorer: string;
        } = Managers.configManager.get("network.client");

        return h
            .view("index", {
                client,
                voteHeader: `Vote ${client.token}`.padStart(10),
                activeDelegatesCount: maxDelegates,
                activeDelegates: this.formatDelegates(activeDelegates, voters, lastBlock.data.height),
                standbyDelegates: this.formatDelegates(standbyDelegates, voters, lastBlock.data.height),
                voters: voters.length.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                }),
                supply: supply.div(1e8).toFixed(),
                totalVotes: totalVotes.div(1e8).toFixed(),
                percentage: totalVotes.times(100).div(supply).toFixed(),
            })
            .type("text/plain");
    }

    private formatDelegates(
        delegates: Contracts.State.Wallet[],
        voters: Contracts.State.Wallet[],
        height: number,
    ): {
        rank: string;
        username: string;
        approval: string;
        votes: string;
        voterCount: string;
    }[] {
        return delegates.map((delegate) => {
            const delegateVoters = voters.filter((wallet) => wallet.getAttribute("vote") === delegate.getPublicKey());

            const approval = Utils.delegateCalculator.calculateApproval(delegate, height).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            const rank = delegate.getAttribute("delegate.rank", 0).toLocaleString(undefined, {
                minimumIntegerDigits: 2,
            });

            const votes = Number(
                delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance").div(1e8),
            ).toLocaleString(undefined, {
                maximumFractionDigits: 0,
            });

            const voterCount = delegateVoters.length.toLocaleString(undefined, {
                maximumFractionDigits: 0,
            });

            return {
                rank,
                username: delegate.getAttribute<string>("delegate.username").padEnd(25),
                approval: approval.padEnd(4),
                votes: votes.padStart(10),
                voterCount: voterCount.padStart(5),
            };
        });
    }
}
