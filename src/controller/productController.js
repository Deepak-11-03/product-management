const validation = require('../validator/validator');
const productModel=require('../models/productModel')

const addProducts = async function(req, res){
    try{
        let data = req.body

        let {title,description,price,currencyId,currencyFormat,availableSizes,installments}=data
        if (!validation.validBody(data)) 
        return res.status(400).send({ status: false, msg: 'Enter details of products.' })

        let files = req.files
        if (files && files.length > 0) {

            let uploadedFileURL = await validation.uploadFile(files[0])
            data.productImage = uploadedFileURL
        }
        else {
          return  res.status(400).send({ msg: "file required" })
        }
        
        if(!validation.isValid(title))
         return res.status(400).send({status : false, msg : "Enter Title"})
        let usedTille = await productModel.findOne({title})
        if(usedTille)
         return res.status(400).send({status : false , msg : "Title already Present"})

        if(!validation.isValid(description)) 
        return res.status(400).send({status : false, msg : "Enter description"})
       
        if(price < 0 || !validation.isValid(price) || !/\d/.test(price))
         return res.status(400).send({status : false, msg : "enter Price"})

        if(currencyId != "INR") 
        return res.status(400).send({status : false, msg : "wrong CurrencyId"})

        if(currencyFormat != '₹')
        return res.status(400).send({status : false, msg : "wrong CurrencyFormat"})

        if(availableSizes <= 0 || !validation.isValid(availableSizes)) 
        return res.status(400).send({status : false, msg : "Add Sizes"})

        if(installments < 0)
         return res.status(400).send({status : false, msg : "Bad Installments Field"})


        let created = await productModel.create(data)
        return res.status(201).send({status :true, msg : "Success", data : created})


    }catch(err){
        res.status(500).send({status :false, msg : err.message})
    }
}

const getdata = async function (req, res) {
    try {
        let query = req.query
        if (query.length == 0) {

            const datafound = await productModel.find({ isDeleted: false })
            if (!datafound) {
                return res.status(404).send({ status: false, msg: 'Product not exist' })
            }
            return res.status(200).send({ status: true, message: "Get Products details", data: datafound })
           
        } else {
            const { size, name, priceGreaterThan, priceLessThan } = query

            let filter={} 

            if (!(size || name || priceGreaterThan || priceLessThan)) {
                return res.status(400).send({ status: false, msg: 'query params details is required' })
            }
            if (size) {

                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size)) {
                    return res.status(400).send({ staus: false, message: "Pleage enter valid size" })
                }
                filter.availableSizes=size;
            }
            if (name) {
                if (!validation.isValid(name)) {
                    console.log(name)
                    return res.status(400).send({ status: false, message: "Product name is required" })
                }
                filter.title = { $regex: name, $options: 'i' };
            }
            if (priceGreaterThan) {
                if (!validation.isValid(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "priceGreaterThan is required" })
                }
                if (!/^[0-9]*$/.test(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "please enter number value" })
                }
                filter.price = {$gt: priceGreaterThan};
            }
            if (priceLessThan) {
                if (!validation.isValid(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "priceLessThan is required" })
                }
                if (!/^[0-9]*$/.test(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "please enter number value" })
                }
                filter.price = {$lt: priceLessThan};
            }
            const getdata = await productModel
                .find({ $and: [{ isDeleted: false }, filter] }).sort({ "price": 1 })
            if (getdata.length > 0) {
                return res.status(200).send({ staus: true, data: getdata })
            } else {
                return res.status(404).send({ status: false, msg: 'Product not exist' })
            }
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}



const getProductById= async function(req,res){
    try {
        let id= req.params.productId

        if(!validation.validObjectId(id)){
            return res.status(400).send({status:false,msg:"invalid productId"})
        }

        let products= await productModel.findOne({_id:id, isDeleted:false})
        if(!products){
            return res.status(404).send({status:false,msg:"product not found"})
        }
        return res.status(200).send({status:true,msg:"Success",data:products})


    } catch (err) {
        return res.status(500).send({status:false, error:err.message})
    }
}



const updateProducts = async function(req, res){
    try{
    let id = req.params.productId
    let data  = req.body
    let files = req.files
    if(!validation.validObjectId(id)){
        return res.status(400).send({status:false,msg:"not a valid onjectId"})
    }
    let product= await productModel.findOne({_id:id,isDeleted:false})
    if (!product) {
        return res.status(404).send({status:false,msg:"no product found with this id"})
    }
    if (!validation.validBody(data)) {
        return res.status(400).send({status:false,msg:"please provide data to update"})
    }
    if (files && files.length > 0) {

        let uploadedFileURL = await validation.uploadFile(files[0])
        data.productImage = uploadedFileURL
    }
    let updateData = await productModel.findByIdAndUpdate({_id:id},data,{new:true})
    return res.status(200).send({status:true,message:"successfully updates",data:updateData})
    }
    catch(err){
        return res.status(500).send({status:false, error:err.message})
    }
}

const deleteProduct = async function(req, res){
    try{
        let productId = req.params.productId
        if(!validation.validObjectId(productId)){
         return res.status(400).send({status : false, msg : "Invalid ObjectId"})
        }
        let findProd = await productModel.findOne({_id:productId, isDeleted : false})
        if(!findProd) return res.status(404).send({status :false, msg : "No Product found or already Deleted"})

         await productModel.findOneAndUpdate({_id : productId}, {isDeleted : true, deletedAt : Date.now()}, {new : true})
        return res.status(200).send({status : true, msg : "Success"})

    }catch(err){
       return res.status(500).send({status : false, error : err.message})
    }
}

module.exports = {addProducts,getdata,getProductById,updateProducts,deleteProduct}

