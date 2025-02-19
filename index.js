// index.js
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs')
const argon2 = require('argon2');
const { v4: uuidv4 } = require("uuid");
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send("<h1>Weathere System</h1><p>This is the API for Weather System.</p>")
})

function containsUnallowedSymbol(str, allowedSymbols) {
  // Create a regex pattern that allows only characters in the list
  let regex = new RegExp(`^[a-zA-Z0-9${allowedSymbols.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]*$`);
  
  // Return true if the string contains an unallowed symbol
  return !regex.test(str);
}

Data = {
}

async function hashPassword(password) {
  const hash = await argon2.hash(password);
  return hash
}

async function CheckToken(username, token) {
  if(Data["Accounts"][username]["Token"] == token){
    return true
  }
  else{
    return false
  }
}


app.post('/signup', async (req, res) => {
  try{
    let {username, password} = req.body
    username = username.toLowerCase()
    if (containsUnallowedSymbol(username, "-_")) {
      res.status(401).json({error:"Usernames can only contain letters, numbers, dashes, and underscores."})
      return
    }
    if(Data["Accounts"][username]){
      res.status(409).json({error:"Account Already Exist"})
    }
    else{
      Data["Accounts"][username] = {
        "Password": await hashPassword(password),
        "Token":0,
        "PhoneNumber":null,
        "VerifyCode":null,
        "State":null,
        "County":null
      }
      res.status(200).json({message:"Good"})
    }
  }
  catch(error){
    console.log(error)
    res.status(500).json({error:"Internal Server Error"})
  }
});

app.post('/login', async (req, res) => {
  try{
    let {username, password} = req.body
    username = username.toLowerCase()
    if (containsUnallowedSymbol(username, "-_")) {
      res.status(401).json({error:"Usernames can only contain letters, numbers, dashes, and underscores."})
      return
    }
    if(Data["Accounts"][username]){
      const isMatch = await argon2.verify(Data["Accounts"][username]["Password"], password);
      if(isMatch){
        Token = uuidv4()
        Data["Accounts"][username]["Token"] = Token
        res.status(200).json({Token:Token})
      }
      else{
        res.status(401).json({error:"Wrong Password."})
      }
    }
    else{
      res.status(404).json({error:"Account Not Found."})
    }
  }
  catch(error){
    console.log(error)
    res.status(500).json({error:"Internal Server Error"})
  }
});

app.post('/verify', async (req, res) => {
  try{
    let {username, token} = req.body
    username = username.toLowerCase()
    if (containsUnallowedSymbol(username, "-_")) {
      res.status(401).json({error:"Usernames can only contain letters, numbers, dashes, and underscores."})
      return
    }
    if(await CheckToken(username, token)){
      res.status(200).json({message:"Good"})
    }
    else{
      res.status(401).json({error:"Token is invalid."})
    }
  }
  catch(error){
    console.log(error)
    res.status(500).json({error:"Internal Server Error"})
  }
})

app.post('/deleteaccount', async (req, res) => {
  try{
    let {username, password} = req.body
    username = username.toLowerCase()
    if (containsUnallowedSymbol(username, "-_")) {
      res.status(401).json({error:"Usernames can only contain letters, numbers, dashes, and underscores."})
      return
    }
    if(await argon2.verify(Data["Accounts"][username]["Password"], password)){
      State = Data["Accounts"][username]["State"]
      County = Data["Accounts"][username]["County"]
      PhoneNumber = Data["Accounts"][username]["PhoneNumber"] 
      if(State != null && County != null && PhoneNumber != null){
        let PhoneList = Data["States"][State][County]["Numbers"]
        let newPhoneList = PhoneList.filter(item => item !== PhoneNumber)
        Data["States"][State][County]["Numbers"] = newPhoneList 
      }
      delete Data["Accounts"][username]
      res.status(200).json({message:"Good"})
    }
    else{
      res.status(401).json({error:"Password is invalid."})
    }
  }
  catch(error){
    console.log(error)
    res.status(500).json({error:"Internal Server Error"})
  }
})

const port = 3000;

function saveDataToFile() {
  fs.writeFile('data.json', JSON.stringify(Data, null, 2), (err) => {
      if (err) {
          console.error('Error saving data:', err);
      } else {
          console.log('Data saved to data.json');
      }
  });
}

function loadDataFromFile() {
  try {
      if (fs.existsSync('data.json')) { // Check if the file exists
          const fileContent = fs.readFileSync('data.json', 'utf8'); // Read file synchronously
          Data = JSON.parse(fileContent); // Parse JSON and set to Data
          console.log('Data loaded from data.json:', Data);
      } else {
          console.log('data.json does not exist. Using default Data.');
      }
  } catch (error) {
      console.error('Error reading data.json:', error);
  }
}

async function StartServer(){
  loadDataFromFile()
  setInterval(saveDataToFile, 3000);
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  if(!Data["Accounts"]){
    Data["Accounts"] = {}
  }
  if(!Data["States"]){
    Data["States"] = {}
  }
}

StartServer()