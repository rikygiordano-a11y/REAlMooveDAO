// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MooveDAO is Ownable {
    IERC20 public paymentToken;

    uint256 public sharePrice;
    bool public saleActive;

    uint256 public totalSharesSold;
    uint256 public totalMembers;

    enum GovernanceMode {
        Majority,
        Consensus
    }

    enum VoteChoice {
        None,
        For,
        Against,
        Abstain
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        GovernanceMode governanceMode;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool approved;
        bool exists;
        uint256 votersCount;
        bool hasTokenTransfer;
        address transferRecipient;
        uint256 transferAmount;
        uint256 membersAtCreation;
        uint256 deadline;
    }

    mapping(address => uint256) public shares;
    mapping(address => bool) public isMember;

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    mapping(uint256 => mapping(address => VoteChoice)) public votes;

    event SharesPurchased(
        address indexed buyer,
        uint256 amountSpent,
        uint256 sharesBought
    );

    event SaleClosed();

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        GovernanceMode governanceMode
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteChoice choice,
        uint256 votingPower
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        bool approved,
        bool tokenTransferExecuted
    );

    modifier onlyMember() {
        require(isMember[msg.sender], "Solo i membri possono eseguire questa funzione");
        _;
    }

    constructor(address _paymentTokenAddress, uint256 _sharePrice) Ownable(msg.sender) {
        require(_paymentTokenAddress != address(0), "Indirizzo token non valido");
        require(_sharePrice > 0, "Prezzo quota non valido");

        paymentToken = IERC20(_paymentTokenAddress);
        sharePrice = _sharePrice;
        saleActive = true;
    }

    function buyShares(uint256 amountToSpend) external {
        require(saleActive, "Vendita quote chiusa");
        require(amountToSpend > 0, "Importo non valido");
        require(amountToSpend % sharePrice == 0, "Importo non multiplo del prezzo quota");

        uint256 sharesToBuy = amountToSpend / sharePrice;
        require(sharesToBuy > 0, "Quote insufficienti");

        bool success = paymentToken.transferFrom(msg.sender, address(this), amountToSpend);
        require(success, "Trasferimento token fallito");

        if (!isMember[msg.sender]) {
            isMember[msg.sender] = true;
            totalMembers++;
        }

        shares[msg.sender] += sharesToBuy;
        totalSharesSold += sharesToBuy;

        emit SharesPurchased(msg.sender, amountToSpend, sharesToBuy);
    }

    function closeSale() external onlyOwner {
        require(saleActive, "Vendita gia chiusa");
        saleActive = false;
        emit SaleClosed();
    }

    function createProposal(
        string memory _title,
        string memory _description,
        GovernanceMode _governanceMode,
        bool _hasTokenTransfer,
        address _transferRecipient,
        uint256 _transferAmount,
        uint256 _duration
    ) external onlyMember {
        require(_duration > 0, "Durata non valida");
        require(bytes(_title).length > 0, "Titolo obbligatorio");

        if (_hasTokenTransfer) {
            require(_transferRecipient != address(0), "Recipient non valido");
            require(_transferAmount > 0, "Importo trasferimento non valido");
        }

        proposalCount++;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            proposer: msg.sender,
            governanceMode: _governanceMode,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            approved: false,
            exists: true,
            votersCount: 0,
            membersAtCreation: totalMembers,
            deadline: block.timestamp + _duration,
            hasTokenTransfer: _hasTokenTransfer,
            transferRecipient: _transferRecipient,
            transferAmount: _transferAmount
        });

        emit ProposalCreated(proposalCount, msg.sender, _title, _governanceMode);
    }

    function vote(uint256 _proposalId, VoteChoice _choice) external onlyMember {
        require(shares[msg.sender] > 0, "Non puoi votare senza quote");
        require(
            _choice == VoteChoice.For ||
                _choice == VoteChoice.Against ||
                _choice == VoteChoice.Abstain,
            "Voto non valido"
        );

        Proposal storage proposal = proposals[_proposalId];

        require(proposal.exists, "Proposta inesistente");
        require(!proposal.executed, "Proposta gia eseguita");
        require(votes[_proposalId][msg.sender] == VoteChoice.None, "Hai gia votato");

        uint256 votingPower = shares[msg.sender];

        if (_choice == VoteChoice.For) {
            proposal.forVotes += votingPower;
        } else if (_choice == VoteChoice.Against) {
            proposal.againstVotes += votingPower;
        } else {
            proposal.abstainVotes += votingPower;
        }

        votes[_proposalId][msg.sender] = _choice;
        proposal.votersCount++;

        emit Voted(_proposalId, msg.sender, _choice, votingPower);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.exists, "Proposta inesistente");
        require(!proposal.executed, "Proposta gia eseguita");
        require(block.timestamp <= proposal.deadline, "Proposta scaduta");

        bool result = false;

        if (proposal.governanceMode == GovernanceMode.Majority) {
            if (proposal.forVotes > proposal.againstVotes) {
                result = true;
            }
        }

        if (proposal.governanceMode == GovernanceMode.Consensus) {
            if (
                proposal.againstVotes == 0 &&
                proposal.abstainVotes == 0 &&
                proposal.votersCount == proposal.membersAtCreation &&
                proposal.forVotes > 0
            ) {
                result = true;
            }
        }

        bool tokenTransferExecuted = false;

        if (result && proposal.hasTokenTransfer) {
            require(
                paymentToken.balanceOf(address(this)) >= proposal.transferAmount,
                "Saldo DAO insufficiente"
            );

            bool success = paymentToken.transfer(
                proposal.transferRecipient,
                proposal.transferAmount
            );
            require(success, "Trasferimento token proposta fallito");

            tokenTransferExecuted = true;
        }

        proposal.executed = true;
        proposal.approved = result;

        emit ProposalExecuted(_proposalId, result, tokenTransferExecuted);
    }

    function getVoteOf(uint256 _proposalId, address _voter)
        external
        view
        returns (VoteChoice)
    {
        require(proposals[_proposalId].exists, "Proposta inesistente");
        return votes[_proposalId][_voter];
    }

    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            uint256 id,
            string memory title,
            string memory description,
            address proposer,
            GovernanceMode governanceMode,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool approved,
            uint256 votersCount,
            uint256 membersAtCreation,
            uint256 deadline,
            bool hasTokenTransfer,
            address transferRecipient,
            uint256 transferAmount
        )
    {
        Proposal memory proposal = proposals[_proposalId];
        require(proposal.exists, "Proposta inesistente");

        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.governanceMode,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.approved,
            proposal.votersCount,
            proposal.membersAtCreation,
            proposal.deadline,
            proposal.hasTokenTransfer,
            proposal.transferRecipient,
            proposal.transferAmount
        );
    }
}