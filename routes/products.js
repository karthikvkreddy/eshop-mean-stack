const { Product } = require('../models/product');
const { Category } = require('../models/category');

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'

}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const filename = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${filename}-${Date.now()}.${extension}`)
    }

})
var uploadOptions = multer({ storage: storage });

router.get(`/products`, async (req, res) => {

    let filter = {};

    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const productList = await Product.find(filter).select('name image id').populate('category');

    if (!productList) {
        res.status(500).json({ success: false })
    }
    res.send(productList);
})

router.get(`/products/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category'); // shows the details of category 

    if (!product) {
        return res.status(500).json({ success: false })
    }
    return res.send(product);
})


router.post(`/products`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category)
    if (!category) return res.status(400).send('Invalid category');

    const file = req.file;

    if (!file) return res.status(400).send('No image in the request');

    const filename = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}`;
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${filename}`,
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
});

router.put(`/products/:id`, uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }

    const category = await Category.findById(req.body.category)
    if (!category) return res.status(400).send('Invalid category');

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(400).send('Invalid product');

    const file = req.file;
    let imagePath;

    if (file) {
        const filename = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${filename}`
    } else {
        imagePath = product.image;
    }
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true });

    if (!updatedProduct) {
        return res.status(500).send('The product cannot be updated');
    }

    return res.send(updatedProduct);
})

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndRemove(req.params.id);
        if (product) {
            return res.status(200).send({ success: true, message: 'the product is deleted!' })
        } else {
            return res.status(404).send({ sucess: false, message: 'the product not found' })
        }
    } catch (err) {
        res.status(400).send({ sucess: false, error: err });
    }
})

router.get('/products/get/count', async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) {
        return res.status(500).send({ success: false });
    }

    return res.send({
        productCount: productCount
    });
})

router.get('/products/get/featured/?:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const producs = await Product.find({ isFeatured: true }).limit(+count);

    if (!producs) {
        return res.status(500).send({ success: false });
    }

    return res.send(producs)
});

router.put('/products/galley-images/:id', uploadOptions.any('uploadedImages'), async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if (!files) {
            return res.status(400).send('No image in the request');
        } else {
            files.map((file) => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true });

        if (!product) {
            return res.status(500).send('The gallery cannot be updated');
        }

        return res.send(product);
    } catch (err) {
        console.log(err)
    }
})
module.exports = router;


