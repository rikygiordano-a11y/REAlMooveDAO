# Moove DAO

## Descrizione del progetto

Moove è un’azienda ipotetica che opera nel settore della micro mobilità condivisa in diverse città europee.  
L’obiettivo di questo progetto è sviluppare uno smart contract DAO che permetta ai membri di partecipare alle decisioni di governance utilizzando un token ERC-20 come metodo di pagamento per acquistare quote della DAO.

La DAO supporta:

- acquisto di quote tramite token ERC-20
- registrazione automatica dei membri dopo il primo acquisto
- creazione di proposte da parte dei membri
- voto ponderato in base al numero di quote possedute
- più strategie di governance
- esecuzione delle proposte
- registro delle proposte e dei voti

---

## Strategie di governance implementate

Il contratto supporta almeno due strategie di governance, come richiesto dal progetto:

### 1. Maggioranza
Una proposta viene approvata se i voti **favorevoli** sono maggiori dei voti **contrari**.

### 2. Consenso
Una proposta viene approvata solo se:

- tutti i membri votano
- nessun membro vota contro
- nessun membro si astiene
- esiste almeno un voto favorevole

Inoltre il contratto supporta tre possibili scelte di voto:

- **Favorevole**
- **Contrario**
- **Astenuto**

---

## Funzionalità principali

### 1. Acquisto quote
Le quote della DAO possono essere acquistate usando il token ERC-20 `PaymentToken`, a un prezzo fisso definito nel contratto.

### 2. Registrazione automatica dei membri
Quando un utente acquista quote per la prima volta, viene registrato automaticamente come membro della DAO.

### 3. Chiusura della vendita
L’owner del contratto può chiudere la fase di vendita delle quote, impedendo ulteriori acquisti.

### 4. Creazione delle proposte
Solo i membri della DAO possono creare nuove proposte.

### 5. Voto ponderato
Il potere di voto di ogni membro è proporzionale al numero di quote possedute.

### 6. Registrazione dei voti
Ogni voto viene salvato e associato all’indirizzo del votante.

### 7. Esecuzione delle proposte
Una proposta può essere eseguita dopo la fase di voto e viene registrata come approvata o rifiutata.

### 8. Trasferimento opzionale di token
Una proposta può includere, in modo opzionale, un trasferimento di token ERC-20 dalla tesoreria della DAO verso un indirizzo Ethereum esterno.

---

## Smart contract

### `PaymentToken.sol`
Contratto ERC-20 utilizzato come token di pagamento per acquistare le quote della DAO.

### `MooveDAO.sol`
Contratto principale che gestisce:

- acquisto quote
- registrazione membri
- creazione proposte
- voto
- esecuzione proposte
- registro storico delle decisioni

---

## Tecnologie utilizzate

- Solidity `0.8.24`
- Hardhat
- OpenZeppelin Contracts
- JavaScript per i test
- TypeScript per la configurazione di Hardhat

---

## Funzionalità implementate

- acquisto quote tramite token ERC-20
- creazione automatica dei membri dopo l’acquisto
- prezzo quota fisso definito nel contratto
- possibilità per l’owner di chiudere la vendita
- creazione di proposte da parte dei membri
- supporto a due strategie di governance:
  - maggioranza
  - consenso
- voto ponderato in base al numero di quote
- supporto ai voti:
  - favorevole
  - contrario
  - astenuto
- esecuzione delle proposte
- salvataggio dello stato della proposta come eseguita o approvata
- registro delle proposte
- registro dei voti dei singoli utenti
- trasferimento opzionale di token ERC-20 verso un indirizzo esterno

---

## Test eseguiti

Sono stati realizzati test Hardhat per verificare i seguenti casi:

- deploy corretto dei contratti
- impostazione corretta di owner, token e prezzo quota
- acquisto quote funzionante
- creazione automatica di un nuovo membro dopo il primo acquisto
- aggiornamento corretto del numero totale di quote vendute
- rifiuto di acquisti con importi non multipli del prezzo quota
- solo l’owner può chiudere la vendita
- impossibilità di acquistare quote dopo la chiusura della vendita
- un non membro non può creare proposte
- un membro può creare proposte con modalità maggioranza
- un membro può creare proposte con modalità consenso
- una proposta può salvare correttamente i dati di un eventuale trasferimento token
- un non membro non può votare
- un utente non può votare due volte la stessa proposta
- il voto ponderato funziona correttamente
- il voto del singolo utente viene registrato correttamente
- è supportato anche il voto di astensione
- una proposta in modalità maggioranza viene approvata correttamente se i voti favorevoli superano i contrari
- una proposta in modalità maggioranza viene rifiutata se i voti contrari superano i favorevoli
- una proposta non può essere eseguita due volte
- una proposta in modalità consenso viene approvata solo se tutti votano a favore
- una proposta in modalità consenso viene rifiutata se anche un solo membro vota contro
- una proposta in modalità consenso viene rifiutata se un membro si astiene
- una proposta approvata può eseguire anche un trasferimento ERC-20 dalla DAO verso un indirizzo esterno

---

## Deployment del contratto

Esempio di esecuzione in locale:

```bash
npm install
npx hardhat compile
npx hardhat test