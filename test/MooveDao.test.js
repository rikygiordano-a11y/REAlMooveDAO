const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MooveDAO", function () {
  let token;
  let dao;
  let owner;
  let user1;
  let user2;
  let outsider;

  const SHARE_PRICE = 10n;
  const ONE_HUNDRED = 100n;
  const TWO_HUNDRED = 200n;
  const FIFTY = 50n;

  beforeEach(async function () {
    [owner, user1, user2, outsider] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("PaymentToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    const DAO = await ethers.getContractFactory("MooveDAO");
    dao = await DAO.deploy(await token.getAddress(), SHARE_PRICE);
    await dao.waitForDeployment();

    await token.mint(user1.address, 1000);
    await token.mint(user2.address, 1000);
  });

  async function buyShares(account, amount) {
    await token.connect(account).approve(await dao.getAddress(), amount);
    await dao.connect(account).buyShares(amount);
  }

  describe("Deployment", function () {
    it("Imposta correttamente owner, token e prezzo quota", async function () {
      expect(await dao.owner()).to.equal(owner.address);
      expect(await dao.sharePrice()).to.equal(SHARE_PRICE);
      expect(await dao.saleActive()).to.equal(true);
      expect(await dao.paymentToken()).to.equal(await token.getAddress());
    });
  });

  describe("Share sale", function () {
    it("Permette l'acquisto quote e crea un nuovo membro", async function () {
      await buyShares(user1, ONE_HUNDRED);

      expect(await dao.shares(user1.address)).to.equal(10n);
      expect(await dao.isMember(user1.address)).to.equal(true);
      expect(await dao.totalMembers()).to.equal(1n);
      expect(await dao.totalSharesSold()).to.equal(10n);
    });

    it("Rifiuta importi non multipli del prezzo quota", async function () {
      await token.connect(user1).approve(await dao.getAddress(), 95);

      await expect(
        dao.connect(user1).buyShares(95)
      ).to.be.revertedWith("Importo non multiplo del prezzo quota");
    });

    it("Solo l'owner puo chiudere la vendita", async function () {
      await expect(
        dao.connect(user1).closeSale()
      ).to.be.reverted;
    });

    it("L'owner puo chiudere la vendita", async function () {
      await dao.connect(owner).closeSale();
      expect(await dao.saleActive()).to.equal(false);
    });

    it("Dopo closeSale non si possono piu comprare quote", async function () {
      await dao.connect(owner).closeSale();

      await token.connect(user1).approve(await dao.getAddress(), ONE_HUNDRED);

      await expect(
        dao.connect(user1).buyShares(ONE_HUNDRED)
      ).to.be.revertedWith("Vendita quote chiusa");
    });
  });

  describe("Proposals", function () {
    beforeEach(async function () {
      await buyShares(user1, ONE_HUNDRED); // 10 quote
      await buyShares(user2, TWO_HUNDRED); // 20 quote
    });

    it("Un non membro non puo creare proposal", async function () {
      await expect(
        dao
          .connect(outsider)
          .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0)
      ).to.be.revertedWith("Solo i membri possono eseguire questa funzione");
    });

    it("Un membro puo creare una proposal Majority", async function () {
      await dao
        .connect(user1)
        .createProposal("Nuova proposta", "Descrizione test", 0, false, ethers.ZeroAddress, 0);

      const proposal = await dao.getProposal(1);

      expect(proposal[0]).to.equal(1n);
      expect(proposal[1]).to.equal("Nuova proposta");
      expect(proposal[4]).to.equal(0n);
      expect(proposal[8]).to.equal(false);
      expect(proposal[9]).to.equal(false);
    });

    it("Un membro puo creare una proposal Consensus", async function () {
      await dao
        .connect(user1)
        .createProposal("Consensus", "Serve voto unanime", 1, false, ethers.ZeroAddress, 0);

      const proposal = await dao.getProposal(1);
      expect(proposal[4]).to.equal(1n);
    });

    it("Una proposal con trasferimento token salva correttamente i dati", async function () {
      await dao
        .connect(user1)
        .createProposal("Pagamento partner", "Trasferimento premio", 0, true, outsider.address, FIFTY);

      const proposal = await dao.getProposal(1);

      expect(proposal[11]).to.equal(true);
      expect(proposal[12]).to.equal(outsider.address);
      expect(proposal[13]).to.equal(FIFTY);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await buyShares(user1, ONE_HUNDRED); // 10 quote
      await buyShares(user2, TWO_HUNDRED); // 20 quote
    });

    it("Un non membro non puo votare", async function () {
      await dao
        .connect(user1)
        .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await expect(
        dao.connect(outsider).vote(1, 1)
      ).to.be.revertedWith("Solo i membri possono eseguire questa funzione");
    });

    it("Non si puo votare due volte", async function () {
      await dao
        .connect(user1)
        .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);

      await expect(
        dao.connect(user1).vote(1, 2)
      ).to.be.revertedWith("Hai gia votato");
    });

    it("Il voto ponderato funziona correttamente", async function () {
      await dao
        .connect(user1)
        .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1); // For -> 10 quote
      await dao.connect(user2).vote(1, 2); // Against -> 20 quote

      const proposal = await dao.getProposal(1);

      expect(proposal[5]).to.equal(10n); // forVotes
      expect(proposal[6]).to.equal(20n); // againstVotes
      expect(proposal[10]).to.equal(2n); // votersCount
    });

    it("Registra il voto del singolo utente", async function () {
      await dao
        .connect(user1)
        .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);

      const savedVote = await dao.getVoteOf(1, user1.address);
      expect(savedVote).to.equal(1n);
    });

    it("Permette anche il voto di astensione", async function () {
      await dao
        .connect(user1)
        .createProposal("Test", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user2).vote(1, 3);

      const proposal = await dao.getProposal(1);
      expect(proposal[7]).to.equal(20n); // abstainVotes
    });
  });

  describe("Execute proposal - Majority", function () {
    beforeEach(async function () {
      await buyShares(user1, TWO_HUNDRED); // 20 quote
      await buyShares(user2, ONE_HUNDRED); // 10 quote
    });

    it("Approva una proposal Majority quando i voti FOR sono superiori", async function () {
      await dao
        .connect(user1)
        .createProposal("Majority pass", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1); // +20
      await dao.connect(user2).vote(1, 2); // +10 contro

      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);

      expect(proposal[8]).to.equal(true);  // executed
      expect(proposal[9]).to.equal(true);  // approved
    });

    it("Rifiuta una proposal Majority quando i voti AGAINST sono maggiori", async function () {
      await dao
        .connect(user1)
        .createProposal("Majority fail", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 2); // 20 contro
      await dao.connect(user2).vote(1, 1); // 10 favore

      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);

      expect(proposal[8]).to.equal(true);
      expect(proposal[9]).to.equal(false);
    });

    it("Non permette di eseguire due volte la stessa proposal", async function () {
      await dao
        .connect(user1)
        .createProposal("Execute once", "Descrizione", 0, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);
      await dao.executeProposal(1);

      await expect(
        dao.executeProposal(1)
      ).to.be.revertedWith("Proposta gia eseguita");
    });
  });

  describe("Execute proposal - Consensus", function () {
    beforeEach(async function () {
      await buyShares(user1, ONE_HUNDRED); // 10
      await buyShares(user2, ONE_HUNDRED); // 10
    });

    it("Approva una proposal Consensus solo se tutti votano FOR", async function () {
      await dao
        .connect(user1)
        .createProposal("Consensus ok", "Descrizione", 1, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);
      await dao.connect(user2).vote(1, 1);

      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);

      expect(proposal[8]).to.equal(true);
      expect(proposal[9]).to.equal(true);
    });

    it("Rifiuta una proposal Consensus se anche un solo membro vota AGAINST", async function () {
      await dao
        .connect(user1)
        .createProposal("Consensus fail", "Descrizione", 1, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);
      await dao.connect(user2).vote(1, 2);

      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);

      expect(proposal[8]).to.equal(true);
      expect(proposal[9]).to.equal(false);
    });

    it("Rifiuta una proposal Consensus se un membro si astiene", async function () {
      await dao
        .connect(user1)
        .createProposal("Consensus abstain fail", "Descrizione", 1, false, ethers.ZeroAddress, 0);

      await dao.connect(user1).vote(1, 1);
      await dao.connect(user2).vote(1, 3);

      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);

      expect(proposal[8]).to.equal(true);
      expect(proposal[9]).to.equal(false);
    });
  });

  describe("Optional token transfer proposal", function () {
    beforeEach(async function () {
      await buyShares(user1, TWO_HUNDRED); // 20
      await buyShares(user2, ONE_HUNDRED); // 10
    });

    it("Se approvata, esegue anche il trasferimento ERC20 dalla DAO verso un address esterno", async function () {
      const daoBalanceBefore = await token.balanceOf(await dao.getAddress());
      expect(daoBalanceBefore).to.equal(300n);

      await dao
        .connect(user1)
        .createProposal(
          "Reward transfer",
          "Invio premio partner",
          0,
          true,
          outsider.address,
          50
        );

      await dao.connect(user1).vote(1, 1); // 20 for
      await dao.connect(user2).vote(1, 2); // 10 against -> passa comunque

      const outsiderBalanceBefore = await token.balanceOf(outsider.address);
      expect(outsiderBalanceBefore).to.equal(0n);

      await dao.executeProposal(1);

      const outsiderBalanceAfter = await token.balanceOf(outsider.address);
      const daoBalanceAfter = await token.balanceOf(await dao.getAddress());
      const proposal = await dao.getProposal(1);

      expect(proposal[9]).to.equal(true);
      expect(outsiderBalanceAfter).to.equal(50n);
      expect(daoBalanceAfter).to.equal(250n);
    });
  });
});