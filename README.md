# Funzionamento Server:
attraverso il comando "node server.js" nel terminale si riesce ad attivare la porta 3000 dove arrivano i messaggi del websocket
bisogna arrivare alla cartella giusta (\.\ServerChess) e per farlo basta utilizzare questo comando "cd /" 
che ti permette di tornare alla cartella principale C:\>, poi basta continuare a scrivere "cd /cartella che contiene server.js"

Avevo iniziato a ideare la parte di login ma non è completata.
Per il login ho utilizzato il framework express e il modulo express-session per gestire le sessioni.
Per il database ho utilizzato il modulo mysql.
Per la parte di login ho creato una tabella utenti con i campi id, username, password e email.
Per la registrazione dati ho creato una tabella registrazione con i campi id, username, password e email.
Per la registrazione dati ho creato una tabella partite con i campi id, id_utente, data, risultato.
Per la registrazione dati ho creato una tabella mosse con i campi id, id_partita, mossa, colore.

