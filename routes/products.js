const {Product} = require('../models/product');
const {Category} = require('../models/category');

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get(`/products`, async (req, res) =>{

    let filter = {};
    
    if(req.query.categories) {
        filter = {category: req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).select('name image id').populate('category');

    if(!productList) {
        res.status(500).json({success: false})
    } 
    res.send(productList);
})

router.get(`/products/:id`, async (req, res) =>{
    const product = await Product.findById(req.params.id).populate('category'); // shows the details of category 

    if(!product) {
        res.status(500).json({success: false})
    } 
    res.send(product);
})


router.post(`/products`, async (req, res) => {
    const category = await Category.findById(req.body.category)
    if(!category) return res.status(400).send('Invalid category');

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    });

    product = await product.save();

    if (!product) {
        return res.status(500).send('The product cannot be created');
    }

    return res.status(201).send(product);
})

router.put(`/products/:id`, async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }

    const category = await Category.findById(req.body.category)
    if(!category) return res.status(400).send('Invalid category');

    const product = await Product.findByIdAndUpdate(
        req.params.id, 
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true});

    if (!product) {
        return res.status(500).send('The product cannot be updated');
    }

    return res.send(product);
})

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndRemove(req.params.id);
        if(product) {
            return res.status(200).send({success: true, message: 'the product is deleted!'})
        } else{
            return res.status(404).send({sucess: false, message: 'the product not found'})
        }
    } catch(err) {  
        res.status(400).send({sucess: false,error: err});
    }
})

router.get('/products/get/count', async (req,res) => {
    const productCount = await Product.countDocuments((count) => count);
    
    if (!productCount) {
        return res.status(500).send({success: false});
    }

    return res.send({
        productCount: productCount });
})

router.get('/products/get/featured/?:count', async (req,res) => {
    const count = req.params.count ? req.params.count: 0;
    const producs = await Product.find({isFeatured: true}).limit(+count);
    
    if (!producs) {
        return res.status(500).send({success: false});
    }

    return res.send(producs)
});



module.exports =router;


