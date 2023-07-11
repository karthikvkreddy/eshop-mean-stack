const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();

router.get(`/categories`, async (req, res) =>{
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).send({success: false})
    } 
    res.status(200).send(categoryList);
})

router.get(`/categories/:id`, async (req, res) =>{
    const category = await Category.findById(req.params.id);

    if(!category) {
        res.status(400).send('The category cannot be created')
    } 
    res.status(200).send(category);
})

router.put(`/categories/:id`, async (req, res) => {

    const category = await Category.findByIdAndUpdate(req.params.id, 
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color
        },
        { new: true}                     // it will return the updated values
        );

    if(!category) {
        res.status(400).send('The category cannot be updated')
    } 
    res.status(200).send(category);
})


router.post('/categories', async (req, res) => {
    
    let category = new Category({
        name: req.body.name,
        image: req.body.image,
        icon: req.body.icon,
        color: req.body.color
    })

    category = await category.save();

    if(!category) {
        return res.status(404).send('the category cannot be created!')
    }
    res.send(category);

})

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndRemove(req.params.id);
        if(category) {
            return res.status(200).send({success: true, message: 'the caetgory is deleted!'})
        } else{
            return res.status(404).send({sucess: false, message: 'the category not found'})
        }
    } catch(err) {  
        res.status(400).send({sucess: false,error: err});
    }
})

module.exports =router;