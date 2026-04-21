# Moove DAO - smart contract con Solidity Advanced

Smart contract DAO sviluppato in **Solidity** e **Hardhat** per simulare la governance decentralizzata di una piattaforma di micro-mobilità condivisa chiamata **Moove**.

Il progetto consente ai membri di acquistare quote tramite token ERC-20, proporre decisioni, votare con peso proporzionale alle quote possedute ed eseguire automaticamente le proposte approvate.

---

# Descrizione del progetto

Moove è un’azienda ipotetica che opera nel settore della mobilità urbana condivisa in diverse città europee.

L’obiettivo del progetto è realizzare una DAO (Decentralized Autonomous Organization) che permetta ai membri della community di partecipare alle decisioni strategiche della piattaforma.

Ogni utente può:

- acquistare quote della DAO tramite token ERC-20
- diventare membro automaticamente
- creare proposte
- votare le decisioni
- partecipare alla governance
- consultare lo storico delle decisioni approvate o rifiutate

---

# Funzionalità implementate

## Gestione quote

- acquisto quote tramite token ERC-20
- prezzo quota fisso definito nel contratto
- aggiornamento totale quote vendute
- possibilità per l’owner di chiudere la vendita

## Gestione membri

- registrazione automatica dopo il primo acquisto
- verifica stato membro

## Governance DAO

- creazione proposte da parte dei membri
- supporto a due strategie di voto:
  - Majority
  - Consensus
- voto ponderato in base al numero di quote possedute
- tre possibili scelte di voto:
  - favorevole
  - contrario
  - astenuto

## Gestione proposte

- esecuzione proposta dopo la votazione
- salvataggio stato proposta:
  - approvata
  - rifiutata
  - eseguita
- storico completo delle proposte

## Trasferimento token opzionale

Una proposta può includere anche un trasferimento ERC-20 dalla tesoreria della DAO verso un indirizzo esterno.

---

# Strategie di governance implementate

## 1. Majority

La proposta viene approvata se i voti favorevoli superano i voti contrari.

### Ideale per:

- decisioni rapide
- modifiche operative
- proposte ordinarie

---

## 2. Consensus

La proposta viene approvata solo se:

- tutti i membri votano
- nessun membro vota contro
- nessun membro si astiene
- esiste almeno un voto favorevole

### Ideale per:

- decisioni importanti
- modifiche strategiche
- utilizzo fondi della DAO

---

# Smart Contracts

## PaymentToken.sol

Token ERC-20 utilizzato per acquistare quote della DAO.

### Funzioni principali:

- mint token agli utenti
- approve spesa token
- transfer token

---

## MooveDAO.sol

Contratto principale della governance.

### Gestisce:

- vendita quote
- membri DAO
- proposte
- votazioni
- esecuzione decisioni
- trasferimenti token opzionali

---

# Tecnologie utilizzate

- Solidity `0.8.24`
- Hardhat
- OpenZeppelin Contracts
- JavaScript per i test
- TypeScript per configurazione Hardhat
- Node.js
- npm

---

# Test eseguiti

Sono stati realizzati test automatici con Hardhat per verificare:

## Deployment

- deploy corretto dei contratti
- owner impostato correttamente
- token corretto collegato
- prezzo quota corretto

## Acquisto quote

- acquisto quote funzionante
- creazione automatica nuovo membro
- aggiornamento quote vendute
- rifiuto importi non validi
- blocco acquisti dopo chiusura vendita

## Proposte

- solo i membri possono creare proposte
- creazione proposta Majority
- creazione proposta Consensus
- salvataggio dati proposta
- proposta con trasferimento token

## Voting

- solo membri possono votare
- impossibile votare due volte
- voto ponderato corretto
- registrazione voto singolo utente
- supporto voto astenuto

## Execute Proposal - Majority

- approvazione con voti favorevoli maggiori
- rifiuto con voti contrari maggiori
- impossibile eseguire due volte

## Execute Proposal - Consensus

- approvazione solo con unanimità
- rifiuto se un membro vota contro
- rifiuto se un membro si astiene

## Token Transfer

- trasferimento ERC-20 corretto verso wallet esterno dopo approvazione proposta

---

# Installazione locale

npm install
npx hardhat compile
npx hardhat test


## Repository GitHub

link: https://github.com/rikygiordano-a11y/REAlMooveDAO



Sepolia Testnet
## Contract Addresses

link PaymentToken: 0x77F6e90a9c3ef7945e625C45BC46d2053FB64028



link MooveDAO: 0xF15Cbd165E61c8e0214a6407f7186Db318bc6CC6



# Competenze dimostrate

Questo progetto dimostra competenze pratiche su:

- sviluppo smart contract in Solidity
- progettazione di una DAO
- utilizzo di token ERC-20
- sistemi di governance decentralizzata
- voting ponderato
- gestione proposal on-chain
- Hardhat per compile e testing
- deploy su Ethereum Sepolia Testnet
- organizzazione di un progetto Web3
- debugging e validazione del codice

---

# Conclusione

Moove DAO rappresenta una simulazione completa di una piattaforma decentralizzata applicata al settore della mobilità urbana condivisa.

Il progetto integra:

- acquisto quote tramite token ERC-20
- registrazione automatica dei membri
- creazione ed esecuzione delle proposte
- strategie di governance Majority e Consensus
- voto ponderato in base alle quote possedute
- trasferimenti opzionali di token dalla tesoreria DAO
- deploy reale su Sepolia Testnet
- test automatici con Hardhat


Riccardo Giordano
