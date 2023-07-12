const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

router.get(`/users`, async (req, res) =>{
    const userList = await User.find().select('name email phone');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.send(userList);
})

router.get(`/users/:id`, async (req, res) =>{
    const user = await User.findById(req.params.id).select('-passwordHash');;

    if(!user) {
        res.status(500).json({success: false})
    } 
    res.send(user);
})

router.put(`/users/:id`, async (req, res) => {
    const userExists = await User.findById(req.params.id);
    let newPassword;

    if(req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10);
    } else {
        newPassword = userExists.passwordHash;
    }

    const user = await User.findByIdAndUpdate(req.params.id, 
        {
            name: req.body.name,
            email: req.body.email,
            color: req.body.color,
            passwordHash: newPassword,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country
        }, { new: true}                     // it will return the updated values
        );

    if(!user) {
        res.status(400).send('The user cannot be updated')
    } 
    res.status(200).send(user);
})

router.post('/api/v1/users/register', async (req, res) => {
    
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        color: req.body.color,
        passwordHash: bcrypt.hashSync(req.body.passwordHash,10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country
    })

    user = await user.save();

    if(!user) {
        return res.status(404).send('the user cannot be created!')
    }
    res.send(user);

})

router.post('/api/v1/users/login', async (req,res) => {
    const user = await User.findOne({email: req.body.email});
    const secret = process.env.secret;

    if (!user) {
        return res.status(400).send('User not found')
    } 

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign({
            userId : user.id,
            isAdmin: user.isAdmin
        },secret , 
        {expiresIn: "1d"});

        return res.status(200).send({email: user.email, token: token}) 
    } else {
        return res.status(400).send("password is wrong") 
    }

});

module.exports = router;