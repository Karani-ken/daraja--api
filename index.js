const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()
const port = process.env.PORT
const app = express();
app.listen(port, () =>{
    console.log(`app is running on port: ${port}`)
})
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())

app.get('/',(req,res)=>{
    res.send(`<h1>Hello from Fusion Africa </h1>`);
})

//stk push end point
app.post('/stk', async  (req, res) =>{
    const phone = req.body.phone.substring(1);
    const amount = req.body.amount;
    console.log(generatePassword())
    console.log(getTimestamp())

    const authResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        auth: {
            username:"qMPjG7YRKo3lEVkNgUN4iciDi3XwlGCSNept0Td3OAf2H5Ap",
            password: 'uRsHEBD1lfwJCgafbfAR6v53ASSARdXxpEYyaxJAb2QtCdd4huuMR9oQi0GhG5iG',
        },
    });

    const accessToken = authResponse.data.access_token;
    console.log(accessToken)

    await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
            BusinessShortCode: 600998,
            Password: generatePassword(), // Function to generate the password
            Timestamp: getTimestamp(), // Function to generate the timestamp
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: `254${phone}`,
            PartyB: 600998,
            PhoneNumber: `254${phone}`,
            CallBackURL: 'https://mydomain.com/validation',
            AccountReference: `254${phone}`,
            TransactionDesc: 'Test',
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,    
            },
        }).then((data) =>{
            console.log(data)
            res.status(200).json(data)
        }).catch((err) =>{
            console.log(err.message);
            res.status(400).json({message:err})
        });
})

function generatePassword() {
 
    const shortcode = 600998;
    const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    return password;
}




// Helper function to get the timestamp
function getTimestamp() {
    const date = new Date();
    const timestamp = date.getFullYear()+
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) + 
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

    return timestamp;
}
