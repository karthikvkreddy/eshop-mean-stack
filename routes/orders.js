const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-items');
const router = express.Router();

router.get(`/orders`, async (req, res) => {
    //populate: first param: column name (forign key), 2nd param: column name in the reference table (primary key)
    // populate is only used as a joins 
    const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 }); // without -1, asending

    if (!orderList) {
        res.status(500).json({ success: false })
    }
    res.send(orderList);
})

router.get(`/orders/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', populate:
                { path: 'product', populate: 'category' }
        }
        );

    if (!order) {
        return res.status(500).json({ success: false })
    }
    return res.send(order);
})


router.post('/orders', async (req, res) => {
    let orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;


    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);


    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })

    order = await order.save();

    if (!order) {
        return res.status(404).send('the order cannot be created!')
    }
    return res.send(order);

})


router.put(`/orders/:id`, async (req, res) => {

    const order = await Order.findByIdAndUpdate(req.params.id,
        {
            status: req.body.status,
        },
        { new: true }                     // it will return the updated values
    );

    if (!order) {
        return res.status(400).send('The order status cannot be updated')
    }
    return res.status(200).send(order);
})


router.delete('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndRemove(req.params.id);
        if (!order) {
            return res.status(404).send({ sucess: false, message: 'the order not found' })
        }
        await order.orderItems.map(async (orderItem) => {
            try {
                await OrderItem.findByIdAndRemove(orderItem);
            } catch (err) {
                res.status(500).json({ success: false, message: 'Seems like there is some problem on the server side' });
            }
        });
        return res.status(200).send({ success: true, message: 'the order is deleted!' })
    } catch (err) {
        return res.status(400).send({ sucess: false, error: err });
    }
})

router.get(`/orders/get/totalSales`, async (req, res) => {
    const totalSales = await Order.aggregate([
        {
            $group: { _id: null, totalSales: { $sum: '$totalPrice' } }
        }
    ])
    if (!totalSales) {
        return res.status(400).send('The order sales cannot be genarated')
    }
    return res.send({ totalSales: totalSales.pop().totalSales })

});

router.get('/orders/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments({});
    if (!orderCount) {
        return res.status(500).send({ success: false });
    }

    return res.send({
        orderCount: orderCount
    });
})


router.get(`/orders/userorders/:userid`, async (req, res) => {
    const order = await Order.find({ 'user': req.params.userid })
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'catogory'
            }
        })

    if (!order) {
        return res.status(500).json({ success: false })
    }
    return res.send(order);
})

module.exports = router;