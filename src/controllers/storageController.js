const Storage = require('../models/Storage');
const ProductStorage = require('../models/ProductStorage');
// const Product = require('../models/Product');

async function getAllStorages(req, res) {
  try {
    const storages = await Storage.find();
    res.json(storages);
  } catch (error) {
    console.error('Error fetching storage locations:', error);
    res.status(500).json({ message: 'Failed to fetch storage locations' });
  }
}

async function createStorage(req, res) {
  const { name, location } = req.body;
  
  try {
    const newStorage = new Storage({ name, location });
    const savedStorage = await newStorage.save();
    res.status(201).json(savedStorage);
  } catch (error) {
    console.error('Error creating storage location:', error);
    res.status(400).json({ 
      message: 'Failed to create storage location',
      error: error.message 
    });
  }
}

async function updateStorage(req, res) {
  const { id } = req.params;
  const { name, location } = req.body;
  
  try {
    const updatedStorage = await Storage.findByIdAndUpdate(
      id, 
      { name, location },
      { new: true }
    );
    
    if (!updatedStorage) {
      return res.status(404).json({ message: 'Storage location not found' });
    }
    
    res.json(updatedStorage);
  } catch (error) {
    console.error('Error updating storage location:', error);
    res.status(400).json({ 
      message: 'Failed to update storage location',
      error: error.message 
    });
  }
}

async function deleteStorageById(req, res) {
  const { id } = req.params;
  
  try {
    // First delete all product storage entries for this location
    await ProductStorage.deleteMany({ storage_id: id });
    
    // Then delete the storage location itself
    const deletedStorage = await Storage.findByIdAndDelete(id);
    
    if (!deletedStorage) {
      return res.status(404).json({ message: 'Storage location not found' });
    }
    
    res.json({ 
      message: 'Storage location and associated products deleted successfully',
      deletedStorage
    });
  } catch (error) {
    console.error('Error deleting storage location:', error);
    res.status(400).json({ 
      message: 'Failed to delete storage location',
      error: error.message 
    });
  }
}

async function getStorageDetails(req, res) {
  const { id } = req.params;
  
  try {
    const storage = await Storage.findById(id);
    if (!storage) {
      return res.status(404).json({ message: 'Storage location not found' });
    }
    
    const productsInStorage = await ProductStorage.find({ storage_id: id })
      .populate('product_id', 'name sku');
      
    res.json({
      storage,
      products: productsInStorage
    });
  } catch (error) {
    console.error('Error fetching storage details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch storage details',
      error: error.message 
    });
  }
}

module.exports = {
  getAllStorages,
  createStorage,
  updateStorage,
  deleteStorageById,
  getStorageDetails
};