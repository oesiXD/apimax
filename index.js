const vayleys = require('@adiwajshing/baileys')
const fs = require('fs')
const conn = new vayleys.WAConnection() 
async function connectToWhatsApp () {
  
    // this will be called as soon as the credentials are updated
conn.on ('open', () => {
    // save credentials whenever updated
    console.log (`credentials updated!`)
    const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
    fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file

})
conn.loadAuthInfo ('./auth_info.json')
await conn.connect() // connect
    // called when WA sends chats
    // this can take up to a few minutes if you have thousands of chats!
    conn.on('chats-received', async ({ hasNewChats }) => {
        console.log(`you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`)

        const unread = await conn.loadAllUnreadMessages ()
        console.log ("you have " + unread.length + " unread messages")
    })
    // called when WA sends chats
    // this can take up to a few minutes if you have thousands of contacts!
    conn.on('contacts-received', () => {
        console.log('you have ' + Object.keys(conn.contacts).length + ' contacts')
    })

    await conn.connect ()
    conn.on('chat-update', chatUpdate => {
        // `chatUpdate` is a partial object, containing the updated properties of the chat
        // received a new message
        if (chatUpdate.messages && chatUpdate.count) {
            const message = chatUpdate.messages.all()[0]
            console.log (message)
        } else console.log (chatUpdate) // see updates (can be archived, pinned etc.)
    })

   



}
// run in main file
connectToWhatsApp ()
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

app.get('/', function (req, res) {
  res.json({
    "tutorial": "Construyendo una API REST con NodeJS 202222"
  });
});
//PARA ENVIAR IMAGENES CON TEXTO O SIN TEXTO

app.post('/sendFile', async(req, res) => {
const  data =req.body;
const id = data.telefono+'@s.whatsapp.net' // the WhatsApp ID 
// send a simple text!
const sentMsg  = await conn.sendMessage (id,  { url: data.url },vayleys.MessageType.document, 
{ mimetype: vayleys.Mimetype.pdf, filename: data.namefile+".pdf"  }) .then((result) => {
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
    const sentMsg  = await conn.sendMessage (id, data.text, vayleys.MessageType.text) .then((result) => {
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