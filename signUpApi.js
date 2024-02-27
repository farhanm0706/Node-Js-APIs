const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const jwt =require('jsonwebtoken')

const app = express();
const port = process.env.PORT | 3000;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/SignUpDb')
    .then(() => console.log("Connected successfully"))
    .catch(err => console.error("Failed to connect", err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String

});

const User = mongoose.model('User', userSchema);

//Endpoint Registration

app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password doesnt match" });
    }

    try {
        
        let existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = new User({
            name,
            email,
            password
        });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message })
    }


});


//Endpoint for All Registered Users

app.get('/allUsers',async(req,res)=>{
    try{
        let users = await User.find();
        if(users){
            return res.status(201).json({message:"All Users sent successfully",Users:users});  
        }
    }
    catch(err){
        return res.status(504).json({message:err.message});
    }
})



//Endpoint Login
app.post('/login',async (req,res)=>{
    const {email,password}=req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User Not Found"});
        }
        if(password!==user.password){
            return res.status(401).json({message:"Invalid password"})
        }

        const jwtToken = jwt.sign({userId:user._id,email:user.email},'qwerty',{expiresIn:'1h'});
        res.status(200).json({jwtToken});
    }
    catch(err){
        res.status(500).json({message:err.message})
    }
});


app.get('/dashboard',verifyToken,async(req,res)=>{
    res.status(200).json({message:"Token verified and loggen In"});
});

function verifyToken(req,res,next){
    const token = req.header('Authorization');
    console.log(token)
    if(!token){
        return res.status(401).json("Access Denied");
    }
   try{
    const decoded=jwt.verify(token,'qwerty');
    req.user=decoded;
    next()
   }catch(err){
    res.status(401).json({message:"Invalid token"})
   }
}

app.listen(port, ()=> console.log(`server running on port:${port}`));






