const {
  default: makeWASocket,
  DisconnectReason,
  useSingleFileAuthState,
  Browsers,
  isJidGroup,
  makeInMemoryStore,
  jidNormalizedUser,
  fetchLatestBaileysVersion,
  getContentType
} = require('@adiwajshing/baileys');
const { Boom } = require('./node_modules/@hapi/boom')
const fs = require('fs')
const pino = require('pino');
const QRCode = require("qrcode") ;
const store = makeInMemoryStore({ logger: pino().child({ level: 'debug', stream: 'store' }) })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store_multi.json')
}, 10.000)
let sock;
const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

async function connectToWhatsApp () {
  let sock = makeWASocket({

    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: Browsers.macOS('Safari')
});

  store.bind(sock.ev)


    
	sock.ev.on('chats.set', item => console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`))
	sock.ev.on('messages.set', item => console.log(`recv ${item.messages.length} messages (is latest: ${item.isLatest})`))
	sock.ev.on('contacts.set', item => console.log(`recv ${item.contacts.length} contacts`))



	sock.ev.on('messages.update', m => console.log(m))
	sock.ev.on('message-receipt.update', m => console.log(m))
	sock.ev.on('presence.update', m => console.log(m))
	sock.ev.on('contacts.upsert', m => console.log(m))

	sock.ev.on('connection.update', (update) => {

    if (update.qr){
      QRCode.toFile('qr.png', update.qr, {
        color: {
          dark: '#00F',  // Blue dots
          light: '#0000' // Transparent background
        }
      }, function (err) {
        if (err) throw err
        console.log('done')
      })
    } 
   
    console.log('estado' )
		const { connection, lastDisconnect } = update
		if(connection === 'close') {
			// reconnect if not logged out
      const statusCode = lastDisconnect.error ? new Boom(lastDisconnect)?.output.statusCode : 0;
      if (statusCode === DisconnectReason.badSession) { console.log(`Bad session file, delete  and run again`); connectToWhatsApp(); }
      else if (statusCode === DisconnectReason.connectionClosed) { console.log('Connection closed, reconnecting....'); connectToWhatsApp() }
      else if (statusCode === DisconnectReason.connectionLost) { console.log('Connection lost, reconnecting....'); connectToWhatsApp() }
      else if (statusCode === DisconnectReason.connectionReplaced) { console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First'); process.exit() }
      else if (statusCode === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Delete  and Scan Again.`); 	connectToWhatsApp(); }
      else if (statusCode === DisconnectReason.restartRequired) { console.log('Restart required, restarting...'); connectToWhatsApp(); }
      else if (statusCode === DisconnectReason.timedOut) { console.log('Connection timedOut, reconnecting...'); connectToWhatsApp(); }
      
		}
        
		console.log('connection update', update)
	})
	// listen for when the auth credentials is updated
	sock.ev.on('creds.update', saveState)

 conn = sock
}
// run in main file
connectToWhatsApp()
.catch (err => console.log("unexpected error: " + err) ) // catch any errors

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/' , async(req, res) => {

try {
  res.json({
    "tutorial": conn
  });
}catch (err) {
  res.json({
    "tutorial": err
  });
}


});

app.get('/recuperar',async(req, res) => {
  if(fs.existsSync("./auth_info_multi.json") || fs.existsSync("./baileys_store_multi.json")){
    fs.unlinkSync('./auth_info_multi.json');
    fs.unlinkSync('./baileys_store_multi.json');
    
   }


   process.exit()


  

});
app.get('/qr.png', function(req,res){

  if(fs.existsSync("./qr.png")){
    res.sendFile('./qr.png',{ root: __dirname });
   }else{
   res.json("No QR");
   }


});

//PARA ENVIAR IMAGENES CON TEXTO O SIN TEXTO

app.post('/sendFile', async(req, res) => {
const  data =req.body;
const id = data.telefono+'@s.whatsapp.net' // the WhatsApp ID 
// send a simple text!
const sentMsg  = await conn.sendMessage(
  id, { document: { url: data.url }, mimetype: 'application/pdf',fileName:"sample.pdf" }) .then((result) => {
    res.json("Archivo enviado");
  })
  .catch((erro) => {
    console.error('Error when sending: ', erro); //return object error
  });

});

app.post('/sendText', async(req, res) => {
const  data =req.body;
    const id = data.telefono+'@s.whatsapp.net' // the WhatsApp ID 
    // send a simple text!
    const sentMsg  = await conn.sendMessage(id, { text: data.text }) .then((result) => {
        res.json("Mensaje enviado :)");
      })
      .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
      });
 
    });

const port = process.env.PORT || 3001;

app.listen(port,() => {
    console.log(`App Server Listening at ${port}`);
 });
