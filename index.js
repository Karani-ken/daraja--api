const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()
const port = process.env.PORT
const app = express();
app.listen(port, () => {
    console.log(`app is running on port: ${port}`)
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get('/', (req, res) => {
    res.send(`<h1>Hello from Fusion Africa </h1>`);
})
function generatePassword() {

    const shortcode = 174379;
    const passkey = process.env.PASSKEY;
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    return password;
}




// Helper function to get the timestamp
function getTimestamp() {
    const date = new Date();
    const timestamp = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    return timestamp;
}
//generate token middleware

const generateToken = async  (req, res, next) => {
    const consumer = process.env.MPESA_CONSUMER_KEY
    const secret = process.env.MPESA_SECRET_KEY

    const auth = new Buffer.from(`${consumer}:${secret}`).toString('base64');
    await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
       headers:{
        authorization: `Basic ${auth}`
       }
    })
    .then((response) =>{
        //console.log(response.data.access_token)
         token = response.data.access_token;
        next()
    }).catch((err) =>{
        console.log(err)
        res.status(400).json(err.message)
    });    

}
//stk push end point
app.post('/stk', generateToken, async (req, res) => {
    const phone = req.body.phone.substring(1);
    const amount = 1;   
    

    await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
            BusinessShortCode:174379 ,
            Password: generatePassword(), // Function to generate the password
            Timestamp: getTimestamp(), // Function to generate the timestamp
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: `254${phone}`,
            PartyB: 174379,
            PhoneNumber: `254${phone}`,
            CallBackURL: 'https://883e-102-7-122-90.ngrok-free.app/callback', //replace with https://jamiimerchants.co.ke/callback
            AccountReference: `254${phone}`,
            TransactionDesc: 'test',
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).then((response) => {           
            res.status(200).json(response.data)
        }).catch((err) => {
            console.log(err);
            res.status(400).json({ message: err })
        });
})
  
//get the call back url
app.post("/callback", (req, res) =>{      
    console.log("callback triggered")
    const callbackData = req.body;
    console.log(callbackData)
    if(!callbackData.body.stkCallback.CallbackMetadata){
        console.log(callbackData.body)
       return res.json("ok");
    }
    console.log(callbackData.body.stkCallback.CallbackMetadata)

    //get the data for saving in the database
    const amount = callbackData.body.stkCallback.CallbackMetadata.Item[0].Value;
    const phone = callbackData.body.stkCallback.CallbackMetadata.Item[4].Value;
    const transactionCode = callbackData.body.stkCallback.CallbackMetadata.Item[1].Value

    console.log({phone, amount, transactionCode})
    //save the transaction to the database
    
});

